import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth-service.js';
import { RateLimiter } from '../services/redis-service.js';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
    const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
    const { allowed } = await RateLimiter.check(ip, 5, 900); // 5 attempts per 15 mins

    if (!allowed) {
        return res.status(429).json({ ok: false, error: 'Too many registration attempts. Please wait 15 minutes.' });
    }

    const { alias, email, clientHash } = req.body;
    try {
        const result = await AuthService.register(alias, email, clientHash);
        res.status(201).json({ ok: true, ...result });
    } catch (error: any) {
        res.status(400).json({ ok: false, error: error.message });
    }
});

router.post('/login', async (req: Request, res: Response) => {
    const ip = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || 'unknown').split(',')[0].trim();
    const { allowed } = await RateLimiter.check(ip, 10, 300); // 10 attempts per 5 mins

    if (!allowed) {
        return res.status(429).json({ ok: false, error: 'Account locked for 5 minutes due to multiple failed attempts.' });
    }

    const { email, clientHash } = req.body;
    try {
        const result = await AuthService.login(email, clientHash);
        res.json({ ok: true, ...result });
    } catch (error: any) {
        res.status(401).json({ ok: false, error: error.message });
    }
});

router.get('/verify', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ ok: false, error: 'No token' });
    
    const session = AuthService.verifyToken(authHeader.slice(7));
    if (!session) return res.status(401).json({ ok: false, error: 'Invalid or expired token' });

    res.json({ ok: true, ...session });
});

export default router;
