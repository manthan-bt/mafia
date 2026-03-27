import { createHash, createHmac, randomBytes, pbkdf2Sync } from 'crypto';

// ─── CONFIG ────────────────────────────────────────────────────────────────
const HMAC_SECRET = process.env.AUTH_SECRET || 'mafia-nightfall-hmac-k3y-2026-' + randomBytes(8).toString('hex');
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';
const SALT_BYTES = 32;
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ─── TYPES ─────────────────────────────────────────────────────────────────
export type UserRole = 'USER' | 'ADMIN' | 'SUPERUSER';

export interface UserRecord {
    id: string;
    alias: string;
    email: string;
    passwordHash: string;   // hex: PBKDF2(clientHash, salt, ...)
    salt: string;   // hex
    createdAt: number;
    mmr: number;
    coins: number;
    wins: number;
    losses: number;
    role: UserRole;
}

export interface SessionToken {
    userId: string;
    alias: string;
    role: UserRole;
    issuedAt: number;
    expiresAt: number;
    signature: string;
}

// ─── USER STORE (in-memory; swap to a DB in production) ──────────────────
const users = new Map<string, UserRecord>(); // keyed by email (lowercase)
const sessions = new Map<string, SessionToken>(); // keyed by tokenId

// ─── CORE CRYPTO ───────────────────────────────────────────────────────────

/** Generates a fresh cryptographic salt */
export function generateSalt(): string {
    return randomBytes(SALT_BYTES).toString('hex');
}

/**
 * Derives the stored server-side hash.
 * Input is the CLIENT-SIDE pre-hash (SHA-256 of raw password).
 * We run PBKDF2-SHA-512 over that with a random salt.
 */
export function hashPassword(clientPreHash: string, salt: string): string {
    return pbkdf2Sync(clientPreHash, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
}

/** Constant-time comparison to prevent timing attacks */
function timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) {
        diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return diff === 0;
}

// ─── SESSION TOKENS ────────────────────────────────────────────────────────

function signPayload(payload: string): string {
    return createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');
}

export function issueToken(user: UserRecord): string {
    const tokenId = randomBytes(16).toString('hex');
    const issuedAt = Date.now();
    const expiresAt = issuedAt + TOKEN_TTL_MS;
    const payload = `${tokenId}.${user.id}.${issuedAt}.${expiresAt}`;
    const sig = signPayload(payload);

    const session: SessionToken = {
        userId: user.id,
        alias: user.alias,
        role: user.role,
        issuedAt,
        expiresAt,
        signature: sig,
    };
    sessions.set(tokenId, session);

    // Return as a compact "tokenId.sig" string — safe to store in localStorage
    return `${tokenId}.${sig}`;
}

export function verifyToken(rawToken: string): SessionToken | null {
    const parts = rawToken.split('.');
    if (parts.length !== 2) return null;
    const [tokenId, clientSig] = parts;

    const session = sessions.get(tokenId);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
        sessions.delete(tokenId);
        return null;
    }

    const payload = `${tokenId}.${session.userId}.${session.issuedAt}.${session.expiresAt}`;
    const expected = signPayload(payload);
    if (!timingSafeEqual(clientSig, expected)) return null;

    return session;
}

export function revokeToken(rawToken: string): void {
    const tokenId = rawToken.split('.')[0];
    if (tokenId) sessions.delete(tokenId);
}

// ─── AUTH OPERATIONS ───────────────────────────────────────────────────────

export interface RegisterResult {
    ok: boolean;
    error?: string;
    token?: string;
    user?: Omit<UserRecord, 'passwordHash' | 'salt'>;
}

export function registerUser(
    alias: string,
    email: string,
    clientPreHash: string   // SHA-256 hex from client
): RegisterResult {
    const key = email.toLowerCase().trim();
    if (users.has(key)) return { ok: false, error: 'Email already registered.' };
    if (!alias.trim() || alias.length < 3) return { ok: false, error: 'Alias must be at least 3 characters.' };
    if (!clientPreHash || clientPreHash.length !== 64) return { ok: false, error: 'Invalid credential format.' };

    const salt = generateSalt();
    const passwordHash = hashPassword(clientPreHash, salt);
    const id = randomBytes(12).toString('hex');

    const user: UserRecord = {
        id, alias: alias.trim(), email: key, passwordHash, salt,
        createdAt: Date.now(), mmr: 1000, coins: 500, wins: 0, losses: 0,
        role: 'USER',
    };
    users.set(key, user);

    const token = issueToken(user);
    const { passwordHash: _ph, salt: _s, ...safeUser } = user;
    return { ok: true, token, user: safeUser };
}

export interface LoginResult {
    ok: boolean;
    error?: string;
    token?: string;
    user?: Omit<UserRecord, 'passwordHash' | 'salt'>;
}

export function loginUser(email: string, clientPreHash: string): LoginResult {
    const key = email.toLowerCase().trim();
    const user = users.get(key);
    // Return same generic error whether user exists or not (prevents enumeration)
    if (!user) return { ok: false, error: 'Invalid credentials.' };

    const expected = hashPassword(clientPreHash, user.salt);
    if (!timingSafeEqual(expected, user.passwordHash)) {
        return { ok: false, error: 'Invalid credentials.' };
    }

    const token = issueToken(user);
    const { passwordHash: _ph, salt: _s, ...safeUser } = user;
    return { ok: true, token, user: safeUser };
}

export function getUser(email: string): UserRecord | undefined {
    return users.get(email.toLowerCase().trim());
}

export function getAllUsers(): UserRecord[] {
    return Array.from(users.values());
}

export function updateUserRole(email: string, role: UserRole): boolean {
    const user = users.get(email.toLowerCase().trim());
    if (!user) return false;
    user.role = role;
    return true;
}

export function promoteToSuperUser(email: string): boolean {
    return updateUserRole(email, 'SUPERUSER');
}

export function updateUserStats(userId: string, stats: { mmrChange: number; coinsReward: number; win: boolean }): boolean {
    const user = Array.from(users.values()).find(u => u.id === userId);
    if (!user) return false;

    user.mmr += stats.mmrChange;
    user.coins += stats.coinsReward;
    if (stats.win) user.wins += 1;
    else user.losses += 1;

    console.log(`[STATS] Updated ${user.alias}: MMR ${user.mmr}, Coins ${user.coins}`);
    return true;
}
