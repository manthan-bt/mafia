import { prisma } from '../lib/prisma.js';
import { createHash, createHmac, randomBytes, pbkdf2Sync } from 'crypto';
import * as dotenv from 'dotenv';

dotenv.config();

const HMAC_SECRET = process.env.AUTH_SECRET || 'mafia-nightfall-default-secret';
const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export interface SessionData {
    userId: string;
    alias: string;
    role: string;
    expiresAt: number;
}

export class AuthService {
    static hashPassword(password: string, salt: string): string {
        return pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST).toString('hex');
    }

    static generateSalt(): string {
        return randomBytes(32).toString('hex');
    }

    static async register(alias: string, email: string, clientPreHash: string) {
        const existing = await prisma.user.findFirst({
            where: { OR: [{ email }, { username: alias }] }
        });

        if (existing) throw new Error('Email or Alias already taken');

        const salt = this.generateSalt();
        const passwordHash = this.hashPassword(clientPreHash, salt);

        const user = await prisma.user.create({
            data: {
                username: alias,
                email,
                passwordHash: `${salt}.${passwordHash}`,
                mmr: 1000,
                coins: 500,
                stats: { create: {} }
            }
        });

        const token = this.issueToken(user.id, user.username, 'USER');
        return { user, token };
    }

    static async login(email: string, clientPreHash: string) {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error('Invalid credentials');

        const [salt, storedHash] = user.passwordHash.split('.');
        const hash = this.hashPassword(clientPreHash, salt);

        if (hash !== storedHash) throw new Error('Invalid credentials');

        const token = this.issueToken(user.id, user.username, 'USER');
        return { user, token };
    }

    private static issueToken(userId: string, alias: string, role: string): string {
        const expiresAt = Date.now() + TOKEN_TTL_MS;
        const payload = JSON.stringify({ userId, alias, role, expiresAt });
        const signature = createHmac('sha256', HMAC_SECRET).update(payload).digest('hex');
        return Buffer.from(payload).toString('base64') + '.' + signature;
    }

    static verifyToken(token: string): SessionData | null {
        try {
            const [payloadB64, signature] = token.split('.');
            const payloadStr = Buffer.from(payloadB64, 'base64').toString();
            const expectedSignature = createHmac('sha256', HMAC_SECRET).update(payloadStr).digest('hex');

            if (signature !== expectedSignature) return null;

            const data = JSON.parse(payloadStr) as SessionData;
            if (Date.now() > data.expiresAt) return null;

            return data;
        } catch {
            return null;
        }
    }
}
