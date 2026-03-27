import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { AuthService } from '../services/auth-service.js';

const router = Router();

// Middleware to protect user routes
const authenticate = (req: any, res: Response, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ ok: false, error: 'Unauthorized' });
    
    const session = AuthService.verifyToken(authHeader.slice(7));
    if (!session) return res.status(401).json({ ok: false, error: 'Session expired' });
    
    req.user = session;
    next();
};

router.get('/profile', authenticate, async (req: any, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            include: { stats: true }
        });
        
        if (!user) return res.status(404).json({ ok: false, error: 'User not found' });
        
        res.json({ ok: true, user });
    } catch (error) {
        res.status(500).json({ ok: false, error: 'Failed to fetch profile' });
    }
});

router.get('/leaderboard', async (_req: Request, res: Response) => {
    try {
        const topUsers = await prisma.user.findMany({
            take: 50,
            orderBy: { mmr: 'desc' },
            select: {
                id: true,
                username: true,
                mmr: true,
                stats: true
            }
        });
        
        const leaderboard = topUsers.map((u, i) => ({
            rank: i + 1,
            username: u.username,
            mmr: u.mmr,
            tier: u.mmr > 2000 ? 'LEGEND' : u.mmr > 1500 ? 'MASTER' : 'DIAMOND',
            winRate: u.stats?.gamesPlayed ? Math.round((u.stats.gamesWon / u.stats.gamesPlayed) * 100) : 0
        }));
        
        res.json({ ok: true, leaderboard });
    } catch (error) {
        res.status(500).json({ ok: false, error: 'Failed to fetch leaderboard' });
    }
});

export default router;
