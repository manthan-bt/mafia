import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import * as dotenv from 'dotenv';
import * as os from 'os';
import { LobbyManager } from './lobby-manager.js';
import { GameEngine, GameState, Role, PlayerAction, Player } from '../shared/game-engine.js';
import { EncryptionService } from '../shared/encryption-service.js';
import { MatchmakingService } from './matchmaking-service.js';
import { MMRService } from '../shared/mmr-service.js';
import { AntiCheatService } from './anti-cheat-service.js';
import { MonetizationService } from './monetization-service.js';
import { AccountService } from './account-service.js';
import { SubscriptionService } from './subscription-service.js';
import { BotManager } from './bot-manager.js';
import { registerUser, loginUser, verifyToken, revokeToken, hashPassword, generateSalt, getUser, getAllUsers, promoteToSuperUser, UserRole, updateUserStats } from './auth.js';
import { generateOTP, storeOTP, verifyOTP, sendOTPEmail } from './email-service.js';
import { randomBytes as cryptoRandomBytes } from 'crypto';
import { totalmem, freemem } from 'os';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

const lobbyManager = new LobbyManager();
const matchmaking = new MatchmakingService();
const antiCheat = new AntiCheatService();
const accounts = new AccountService();
const subscriptions = new SubscriptionService();

// Per-lobby state (actions and votes as Maps stored on lobby object)
// We extend the Lobby type at runtime with these two Maps
function getLobbyActions(lobby: any): Map<string, PlayerAction> {
    if (!lobby._actions) lobby._actions = new Map<string, PlayerAction>();
    return lobby._actions;
}
function getLobbyVotes(lobby: any): Map<string, string> {
    if (!lobby._votes) lobby._votes = new Map<string, string>();
    return lobby._votes;
}

// ----- REST ENDPOINTS -----
app.post('/api/lobby/create', (req, res) => {
    const { hostName, settings } = req.body;
    const name = hostName || `Operative_${Math.floor(Math.random() * 9999)}`;
    // We create a "phantom" lobby here so Play.tsx can get the code
    // The host will then join via socket with this code
    const code = lobbyManager.generateCode();
    res.json({ code, settings });
});

app.get('/api/server-info', (_req, res) => {
    const interfaces = os.networkInterfaces();
    const addresses: string[] = [];
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] ?? []) {
            if (iface.family === 'IPv4' && !iface.internal) {
                addresses.push(iface.address);
            }
        }
    }
    res.json({ host: addresses[0] || 'localhost', port: process.env.PORT || 3005 });
});

// ----- AUTH ENDPOINTS -----
// IP-based rate limiter: max 5 attempts per 15 minutes
const authAttempts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 15 * 60 * 1000; // 15 min

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const record = authAttempts.get(ip);
    if (!record || now > record.resetAt) {
        authAttempts.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
        return { allowed: true };
    }
    if (record.count >= RATE_LIMIT) {
        return { allowed: false, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
    }
    record.count++;
    return { allowed: true };
}

app.post('/api/auth/register', (req, res) => {
    const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
    const { allowed, retryAfter } = checkRateLimit(ip);
    if (!allowed) {
        return res.status(429).json({ ok: false, error: `Too many attempts. Retry in ${retryAfter}s.` });
    }
    const { alias, email, clientHash } = req.body;
    if (!alias || !email || !clientHash) return res.status(400).json({ ok: false, error: 'Missing fields.' });
    const result = registerUser(alias, email, clientHash);
    console.log(`[AUTH] Register: ${email} (${alias}) - Result: ${result.ok ? 'SUCCESS' : 'FAIL: ' + result.error}`);
    return res.status(result.ok ? 201 : 409).json(result);
});

app.post('/api/auth/login', (req, res) => {
    const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
    const { allowed, retryAfter } = checkRateLimit(ip);
    if (!allowed) {
        return res.status(429).json({ ok: false, error: `Account locked. Retry in ${retryAfter}s.`, locked: true });
    }
    const { email, clientHash } = req.body;
    if (!email || !clientHash) return res.status(400).json({ ok: false, error: 'Missing fields.' });
    const result = loginUser(email, clientHash);
    console.log(`[AUTH] Login: ${email} - Result: ${result.ok ? 'SUCCESS' : 'FAIL: ' + result.error}`);
    return res.status(result.ok ? 200 : 401).json(result);
});

app.get('/api/auth/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ ok: false, error: 'No token.' });
    const token = authHeader.slice(7);
    const session = verifyToken(token);
    if (!session) return res.status(401).json({ ok: false, error: 'Token invalid or expired.' });
    return res.json({ ok: true, userId: session.userId, alias: session.alias, expiresAt: session.expiresAt });
});

app.post('/api/auth/logout', (req, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) revokeToken(authHeader.slice(7));
    return res.json({ ok: true });
});

// ----- ECONOMY & PROFILE ENDPOINTS -----

// Get profile stats (coins, MMR, wins, role)
app.get('/api/user/profile', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ ok: false, error: 'Authorization required.' });
    const token = authHeader.slice(7);
    const session = verifyToken(token);
    if (!session) return res.status(401).json({ ok: false, error: 'Session expired.' });

    const usersList = getAllUsers();
    const user = usersList.find(u => u.id === session.userId);
    if (!user) return res.status(404).json({ ok: false, error: 'Operative not found.' });

    return res.json({
        ok: true,
        profile: {
            id: user.id,
            alias: user.alias,
            email: user.email,
            mmr: user.mmr,
            coins: user.coins,
            wins: user.wins,
            losses: user.losses,
            role: user.role
        }
    });
});

// Get global leaderboard
app.get('/api/leaderboard', (req, res) => {
    const usersList = getAllUsers();
    const entries = usersList
        .sort((a, b) => b.mmr - a.mmr)
        .slice(0, 50)
        .map((u, i) => ({
            rank: i + 1,
            username: u.alias,
            mmr: u.mmr,
            tier: u.mmr > 2000 ? 'LEGEND' : u.mmr > 1500 ? 'MASTER' : 'DIAMOND',
            successRate: u.wins + u.losses > 0 ? `${Math.round((u.wins / (u.wins + u.losses)) * 100)}%` : '0%',
            delta: '+0' // Simulated trend
        }));

    return res.json({ ok: true, leaderboard: entries });
});

// Simulate purchase from store
app.post('/api/store/purchase', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ ok: false, error: 'Authorization required.' });
    const token = authHeader.slice(7);
    const session = verifyToken(token);
    if (!session) return res.status(401).json({ ok: false, error: 'Session expired.' });

    const { sku } = req.body;
    const item = MonetizationService.STORE_ITEMS.find(i => i.sku === sku);
    if (!item) return res.status(404).json({ ok: false, error: 'Asset not found in armory.' });

    const usersList = getAllUsers();
    const user = usersList.find(u => u.id === session.userId);
    if (!user) return res.status(404).json({ ok: false, error: 'Operative not found.' });

    if (user.coins < item.price) {
        return res.status(402).json({ ok: false, error: 'Insufficient funds in treasury.' });
    }

    user.coins -= item.price;
    console.log(`[ECONOMY] Purchase: ${user.alias} bought ${item.name} for ${item.price} bits.`);

    return res.json({
        ok: true,
        message: 'Requisition authorized.',
        remainingBalance: user.coins,
        item: item.name
    });
});

// Add coins (Simulated funding)
app.post('/api/user/add-coins', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ ok: false, error: 'Authorization required.' });
    const token = authHeader.slice(7);
    const session = verifyToken(token);
    if (!session) return res.status(401).json({ ok: false, error: 'Session expired.' });

    const { amount } = req.body;
    const addAmount = parseInt(amount) || 1000;

    const usersList = getAllUsers();
    const user = usersList.find(u => u.id === session.userId);
    if (!user) return res.status(404).json({ ok: false, error: 'Operative not found.' });

    user.coins += addAmount;
    console.log(`[ECONOMY] Funding: ${user.alias} received ${addAmount} bits.`);

    return res.json({ ok: true, balance: user.coins });
});

// ----- ADMIN MIDDLEWARE -----
function requireSuperUser(req: any, res: any, next: any) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ ok: false, error: 'Authorization required.' });
    const token = authHeader.slice(7);
    const session = verifyToken(token);
    if (!session || session.role !== 'SUPERUSER') {
        return res.status(403).json({ ok: false, error: 'Restricted access: Super User clearance required.' });
    }
    req.user = session;
    next();
}

// ----- ADMINISTRATIVE ENDPOINTS -----

// Get system stats (Admin only)
app.get('/api/admin/system-stats', requireSuperUser, (req, res) => {
    const totalMemory = totalmem();
    const freeMemory = freemem();
    const usedMemory = totalMemory - freeMemory;

    res.json({
        ok: true,
        stats: {
            cpuUsage: (Math.random() * 30 + 5).toFixed(1), // Mocked for now, or use pidusage
            memoryUsage: ((usedMemory / totalMemory) * 100).toFixed(1),
            totalMemory: (totalMemory / 1024 / 1024 / 1024).toFixed(1) + ' GB',
            freeMemory: (freeMemory / 1024 / 1024 / 1024).toFixed(1) + ' GB',
            uptime: Math.floor(process.uptime()),
            activeLobbies: lobbyManager.getAllLobbies().length,
            activeSockets: io.engine.clientsCount,
        }
    });
});

// List all operatives (Admin only)
app.get('/api/admin/users', requireSuperUser, (req, res) => {
    const users = getAllUsers().map(u => ({
        id: u.id,
        alias: u.alias,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        mmr: u.mmr
    }));
    res.json({ ok: true, users });
});

// Promote user (Admin or Secret Key)
app.post('/api/admin/promote', (req, res) => {
    const { email, role, secretKey } = req.body;

    // Check for secret environment key or existing superuser token
    const MASTER_KEY = process.env.ADMIN_MASTER_KEY || 'nightfall-terminal-override-2026';
    const isMaster = secretKey === MASTER_KEY;

    let isAuthorized = isMaster;
    if (!isMaster) {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            const session = verifyToken(authHeader.slice(7));
            if (session?.role === 'SUPERUSER') isAuthorized = true;
        }
    }

    if (!isAuthorized) return res.status(403).json({ ok: false, error: 'Unauthorized promotion request.' });

    const success = promoteToSuperUser(email);
    res.json({ ok: success, message: success ? `User ${email} promoted to SUPERUSER.` : 'User not found.' });
});


// ----- PASSWORD RECOVERY -----
// Stores reset tokens: Map<token, { email, expiresAt }>
const resetTokens = new Map<string, { email: string; expiresAt: number }>();

// Step 1: Request OTP
app.post('/api/auth/forgot-password', async (req, res) => {
    const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
    const { allowed, retryAfter } = checkRateLimit(ip);
    if (!allowed) return res.status(429).json({ ok: false, error: `Rate limited. Retry in ${retryAfter}s.` });

    const { email } = req.body;
    if (!email) return res.status(400).json({ ok: false, error: 'Email required.' });

    const user = getUser(email);
    // Always respond ok to prevent email enumeration
    if (user) {
        const otp = generateOTP();
        storeOTP(email, otp);
        await sendOTPEmail(email, otp, user.alias);
    }
    return res.json({ ok: true, message: 'If that email is registered, an OTP has been sent.' });
});

// Step 2: Verify OTP → issue short-lived reset token
app.post('/api/auth/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ ok: false, error: 'Email and OTP required.' });

    const result = verifyOTP(email, otp);
    if (!result.ok) return res.status(401).json(result);

    // Issue a 10-minute single-use reset token
    const resetToken = cryptoRandomBytes(24).toString('hex');
    resetTokens.set(resetToken, { email: email.toLowerCase(), expiresAt: Date.now() + 10 * 60 * 1000 });
    return res.json({ ok: true, resetToken });
});

// Step 3: Reset password using reset token
app.post('/api/auth/reset-password', (req, res) => {
    const { resetToken, clientHash } = req.body;
    if (!resetToken || !clientHash) return res.status(400).json({ ok: false, error: 'Missing fields.' });

    const record = resetTokens.get(resetToken);
    if (!record || Date.now() > record.expiresAt) {
        resetTokens.delete(resetToken);
        return res.status(401).json({ ok: false, error: 'Reset token expired or invalid.' });
    }

    const user = getUser(record.email);
    if (!user) return res.status(404).json({ ok: false, error: 'User not found.' });

    // Update password hash with new credentials
    const salt = generateSalt();
    user.passwordHash = hashPassword(clientHash, salt);
    user.salt = salt;
    resetTokens.delete(resetToken); // single use

    return res.json({ ok: true, message: 'Password updated successfully.' });
});

// ----- BOT CHAT -----
const VILLAGER_PHRASES = [
    (n: string) => `I'm suspicious of ${n}. They've been too quiet.`,
    (n: string) => `${n}, explain yourself. What did you do last night?`,
    (_: string) => `We need to vote carefully. Don't let the Mafia win.`,
    (n: string) => `Has anyone else noticed ${n}'s behaviour?`,
    (_: string) => `The killer is still here. Stay sharp.`,
    (n: string) => `I don't trust ${n}. Something feels off.`,
    (n: string) => `${n} voted suspiciously last round. Could be Mafia.`,
    (_: string) => `Vote smart. Don't throw it away on a guess.`,
];

const DOCTOR_CLAIM_PHRASES = [
    (saved: string) => `I'm the Doctor. I protected ${saved} last night. They're safe.`,
    (saved: string) => `Doctor here — I used my save on ${saved} this round.`,
    (saved: string) => `I shielded ${saved}. If they're alive, it's because of me.`,
];

const POLICE_CLAIM_PHRASES = [
    (target: string, result: string) => `I'm the Detective. I investigated ${target} last night — they came back ${result}.`,
    (target: string, result: string) => `Police here. I ran a check on ${target}: ${result}. Act accordingly.`,
    (target: string, result: string) => `My investigation on ${target} returned ${result}. Trust me on this.`,
];

const MAFIA_FAKE_DOCTOR = [
    (fake: string) => `I'm the Doctor. I saved ${fake} last night. You're welcome.`,
    (fake: string) => `Doctor here — protected ${fake} this cycle. They're safe.`,
    (fake: string) => `I used my ability on ${fake}. As the Doctor, I had to protect them.`,
];

const MAFIA_FAKE_POLICE = [
    (fake: string) => `I'm the Detective. Investigated ${fake} last night — came back CLEAN.`,
    (fake: string) => `Police report: ${fake} is innocent. I checked.`,
    (fake: string) => `As the Detective, I can confirm ${fake} is not Mafia. Move on.`,
];

function randFrom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

function scheduleBotChat(
    io: Server,
    lobby: any,
    code: string,
    botActions: Map<string, PlayerAction>,
    lastDeath?: string // name of player who just died
) {
    const aliveBots = (lobby.players as Player[]).filter((p: any) => p.id.startsWith('bot_') && p.isAlive);
    const alivePlayers = (lobby.players as Player[]).filter((p: any) => p.isAlive);
    if (!aliveBots.length) return;

    // Pick 2-3 bots to speak
    const speakers = [...aliveBots].sort(() => Math.random() - 0.5).slice(0, Math.min(aliveBots.length, Math.floor(Math.random() * 2) + 2));

    speakers.forEach((bot: any, i: number) => {
        // Human-like typing delay based on message length or index
        const typingDelay = 1500 + (i * 2500) + Math.random() * 2000;

        const others = alivePlayers.filter((p: any) => p.id !== bot.id);
        const randomOther = randFrom(others);
        const action = botActions.get(bot.id);
        const targetPlayer = action ? alivePlayers.find((p: any) => p.id === action.targetId) : null;

        let content = '';

        // Contextual awareness: React to death
        if (lastDeath && Math.random() > 0.6) {
            content = randFrom([
                `RIP ${lastDeath}. We need to find who did this.`,
                `${lastDeath} didn't deserve that. Any leads?`,
                `The Mafia is getting bold. ${lastDeath} was a clean operative.`,
                `One more down. We're running out of time.`
            ]);
        } else {
            switch (bot.role) {
                case Role.DOCTOR:
                    if (targetPlayer && Math.random() > 0.4) {
                        content = randFrom(DOCTOR_CLAIM_PHRASES)(targetPlayer.name);
                    } else {
                        content = BotManager.generateChatMessage(bot, GameState.DISCUSSION_PHASE);
                    }
                    break;
                case Role.POLICE:
                    if (targetPlayer) {
                        const isThisMafia = targetPlayer.role === Role.MAFIA;
                        const result = isThisMafia ? '⛔ MAFIA' : '✅ CLEAN';
                        content = randFrom(POLICE_CLAIM_PHRASES)(targetPlayer.name, result);
                    } else {
                        content = BotManager.generateChatMessage(bot, GameState.DISCUSSION_PHASE);
                    }
                    break;
                case Role.MAFIA:
                    const fakeTarget = randFrom(others.filter((p: any) => p.role !== Role.MAFIA) || others);
                    if (Math.random() > 0.5) {
                        content = randFrom(MAFIA_FAKE_POLICE)(fakeTarget?.name || 'someone');
                    } else {
                        content = randFrom(MAFIA_FAKE_DOCTOR)(fakeTarget?.name || 'someone');
                    }
                    break;
                default:
                    content = BotManager.generateChatMessage(bot, GameState.DISCUSSION_PHASE);
            }
        }

        if (content) {
            setTimeout(() => {
                io.to(code).emit('chat_message', {
                    sender: bot.name,
                    senderId: bot.id,
                    content,
                    isBot: true,
                });
            }, typingDelay);
        }
    });
}

// ----- SOCKET EVENTS -----
io.on('connection', (socket: Socket) => {
    console.log('User connected:', socket.id);


    const handleActionSubmission = (code: string, playerId: string, action: PlayerAction) => {
        const lobby = lobbyManager.getLobby(code);
        if (!lobby) return;

        const actions = getLobbyActions(lobby);
        actions.set(playerId, action);

        const specializedAlive = (lobby.players as any[]).filter(
            (p: any) => p.isAlive && p.role !== Role.VILLAGER
        ).length;

        if (actions.size >= specializedAlive) {
            const result = GameEngine.resolveNightPhase(Array.from(actions.values()));

            let deadName = '';
            if (result.deathId) {
                const deadPlayer = (lobby.players as Player[]).find((p: any) => p.id === result.deathId);
                if (deadPlayer) {
                    deadPlayer.isAlive = false;
                    deadName = deadPlayer.name;
                    BotManager.updateSuspicion(lobby, 'DEATH', { victimId: result.deathId });
                }
            }

            io.to(code).emit('night_resolved', result);

            const winResult = GameEngine.checkWinCondition(lobby.players);
            if (winResult.winner) {
                io.to(code).emit('game_over', { winner: winResult.winner });
            } else {
                io.to(code).emit('game_state_changed', { gameState: GameState.DISCUSSION_PHASE });

                const botActionSnapshot = new Map<string, PlayerAction>(
                    Array.from(actions.entries()).filter(([id]) => id.startsWith('bot_'))
                );

                scheduleBotChat(io, lobby, code, botActionSnapshot, deadName);

                setTimeout(() => {
                    io.to(code).emit('game_state_changed', { gameState: GameState.VOTING_PHASE });
                    BotManager.handleBotVotes(io, lobby, (id, targetId) => {
                        handleVoteSubmission(code, id, targetId);
                    });
                }, 10000);
            }
            actions.clear();
        }
    };

    const handleVoteSubmission = (code: string, voterId: string, targetId: string) => {
        const lobby = lobbyManager.getLobby(code);
        if (!lobby) return;

        const votes = getLobbyVotes(lobby);
        votes.set(voterId, targetId);

        const alivePlayers = (lobby.players as any[]).filter((p: any) => p.isAlive);
        if (votes.size >= alivePlayers.length) {
            const voteCounts: Record<string, number> = {};
            votes.forEach((target) => {
                voteCounts[target] = (voteCounts[target] || 0) + 1;
            });

            const sortedVotes = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
            let eliminatedId: string | null = null;
            if (sortedVotes.length > 0 && sortedVotes[0][1] > 0) {
                eliminatedId = sortedVotes[0][0];
                const player = (lobby.players as any[]).find((p: any) => p.id === eliminatedId);
                if (player) player.isAlive = false;
            }

            io.to(code).emit('voting_resolved', { eliminatedId, voteCounts });
            votes.clear();

            setTimeout(() => {
                const winResult = GameEngine.checkWinCondition(lobby.players);
                if (winResult.winner) {
                    io.to(code).emit('game_over', { winner: winResult.winner });
                } else {
                    io.to(code).emit('game_state_changed', { gameState: GameState.NIGHT_PHASE });
                    BotManager.handleBotActions(io, lobby, GameState.NIGHT_PHASE, (id, action) => {
                        handleActionSubmission(code, id, action);
                    });
                }
            }, 4000);
        }
    };

    socket.on('create_lobby', ({ playerName, code: preferredCode }) => {
        const lobby = lobbyManager.createLobby(socket.id, playerName, preferredCode);
        const key = EncryptionService.generateKey();
        (lobby as any).encryptionKey = key;
        socket.join(lobby.code);
        socket.emit('lobby_created', { ...lobby, encryptionKey: key });
    });

    socket.on('join_lobby', ({ code, playerName }) => {
        const lobby = lobbyManager.joinLobby(code, socket.id, playerName);
        if (lobby) {
            socket.join(code);
            io.to(code).emit('player_joined', lobby);
        } else {
            socket.emit('error', { message: 'Lobby not found or full' });
        }
    });

    socket.on('leave_lobby', ({ code }) => {
        const lobby = lobbyManager.leaveLobby(code, socket.id);
        socket.leave(code);
        if (lobby) {
            io.to(code).emit('player_joined', lobby); // update the remaining players
        }
    });

    socket.on('start_game', ({ code }) => {
        const lobby = lobbyManager.getLobby(code);
        if (!lobby) return;

        const hostPlayer = (lobby.players as any[]).find((p: any) => p.id === socket.id && p.isHost);
        if (!hostPlayer) return;

        // Fill with bots to minimum 6 players
        if (lobby.players.length < 6) {
            BotManager.fillWithBots(lobby, 6);
            io.to(code).emit('player_joined', lobby);
        }

        const roles = GameEngine.calculateRoles(lobby.players.length);
        (lobby.players as any[]).forEach((player: any, index: number) => {
            player.role = roles[index];
        });

        const key = (lobby as any).encryptionKey;

        // Emit game_started so Lobby.tsx can navigate
        io.to(code).emit('game_started', { code });

        // Delay ROLE_REVEAL so clients have time to navigate and mount Game.tsx first
        setTimeout(() => {
            // Send ROLE_REVEAL to each human player including their own role
            (lobby.players as any[]).forEach((player: any) => {
                if (!player.id.startsWith('bot_')) {
                    io.to(player.id).emit('game_state_changed', {
                        gameState: GameState.ROLE_REVEAL,
                        encryptionKey: key,
                        players: lobby.players,
                        yourRole: player.role,   // <-- player's own role in payload
                    });
                }
            });
        }, 800);

        setTimeout(() => {
            io.to(code).emit('game_state_changed', { gameState: GameState.NIGHT_PHASE, players: lobby.players });
            BotManager.handleBotActions(io, lobby, GameState.NIGHT_PHASE, (id, action) => {
                handleActionSubmission(code, id, action);
            });
        }, 6000);
    });

    socket.on('submit_action', ({ code, action }) => {
        handleActionSubmission(code, socket.id, action);
    });

    socket.on('submit_vote', ({ code, targetId }) => {
        handleVoteSubmission(code, socket.id, targetId);
    });

    // --- CHAT ---
    socket.on('send_message', ({ code, sender, content }: { code: string; sender: string; content: string }) => {
        const lobby = lobbyManager.getLobby(code);
        if (!lobby) return;
        io.to(code).emit('chat_message', {
            sender,
            senderId: socket.id,
            content,
            isBot: false,
        });
    });

    // --- SOLO BOT GAME ---
    socket.on('start_solo_game', (
        { playerName, botCount, difficulty }: { playerName: string; botCount: number; difficulty?: string },
        ack?: (data: { code: string }) => void
    ) => {
        const lobby = lobbyManager.createLobby(socket.id, playerName);
        const key = EncryptionService.generateKey();
        (lobby as any).encryptionKey = key;
        socket.join(lobby.code);

        const bots = Math.max(5, Math.min(14, botCount || 7));
        BotManager.fillWithBots(lobby, 1 + bots);

        const roles = GameEngine.calculateRoles(lobby.players.length);
        (lobby.players as any[]).forEach((player: any, index: number) => {
            player.role = roles[index];
        });

        const humanPlayer = (lobby.players as any[]).find((p: any) => !p.id.startsWith('bot_'));

        // Acknowledge with the game code so client can navigate immediately
        if (typeof ack === 'function') {
            ack({ code: lobby.code });
        }

        socket.emit('game_started', { code: lobby.code });

        // Delay ROLE_REVEAL so Game.tsx has time to mount after navigation
        setTimeout(() => {
            socket.emit('game_state_changed', {
                gameState: GameState.ROLE_REVEAL,
                encryptionKey: key,
                players: lobby.players,
                yourRole: humanPlayer?.role,    // <-- role in payload, not separate event
            });
        }, 800);

        setTimeout(() => {
            socket.emit('game_state_changed', { gameState: GameState.NIGHT_PHASE, players: lobby.players });
            BotManager.handleBotActions(io, lobby, GameState.NIGHT_PHASE, (id, action) => {
                handleActionSubmission(lobby.code, id, action);
            }, difficulty);
        }, 6000);
    });

    socket.on('join_queue', ({ mmr, mode, playerName }) => {
        matchmaking.addToQueue(socket.id, mmr || 1000, mode || 'CASUAL', playerName);
    });

    socket.on('leave_queue', () => {
        matchmaking.removeFromQueue(socket.id);
    });

    socket.on('voice_signal', ({ targetId, signal }) => {
        io.to(targetId).emit('voice_signal', { from: socket.id, signal });
    });

    socket.on('game_finished', ({ code, winner }) => {
        const lobby = lobbyManager.getLobby(code);
        if (!lobby) return;

        (lobby.players as any[]).forEach((p: any) => {
            const isWinner =
                p.role === winner ||
                (winner === 'VILLAGERS' &&
                    (p.role === Role.POLICE || p.role === Role.DOCTOR || p.role === Role.VILLAGER));
            const mmrChange = MMRService.calculateMMRChange(1000, 1000, isWinner, {
                survived: p.isAlive,
                votingAccuracy: 0.8,
                roleEfficiency: 0.7,
            });
            const coinsReward = MonetizationService.calculateRewards(isWinner, 0.7);
            if (!p.id.startsWith('bot_')) {
                // Determine real userId from session if possible, but here we only have socket.id
                // We should store userId on the player object during join_lobby/start_game
                // For now, we attempt to find user by alias or stored ID
                updateUserStats(p.userId || p.id, { mmrChange, coinsReward, win: isWinner });
                io.to(p.id).emit('match_results', { mmrChange, coinsReward });
            }
        });

        lobbyManager.deleteLobby(code);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        // Auto-remove from queues
        matchmaking.removeFromQueue(socket.id);
    });
});

// Matchmaking loop
setInterval(() => {
    const matches: any[][] = matchmaking.findMatches();
    matches.forEach((matchPlayers) => {
        const host = matchPlayers[0];
        const lobby = lobbyManager.createLobby(host.id, host.name);
        const key = EncryptionService.generateKey();
        (lobby as any).encryptionKey = key;

        for (let i = 1; i < matchPlayers.length; i++) {
            lobbyManager.joinLobby(lobby.code, matchPlayers[i].id, matchPlayers[i].name);
        }

        matchPlayers.forEach((p: any) => io.to(p.id).emit('match_found', { code: lobby.code }));
    });
}, 5000);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`🎮 Mafia Server running on port ${PORT}`);
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] ?? []) {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`🌐 LAN address: http://${iface.address}:${PORT}`);
            }
        }
    }
});
