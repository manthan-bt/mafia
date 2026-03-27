import { createClient } from 'redis';
import * as dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = createClient({
    url: REDIS_URL
});

redis.on('error', (err) => console.error('Redis Client Error', err));

export async function connectRedis() {
    if (!redis.isOpen) {
        await redis.connect();
        console.log('[REDIS] Connected to', REDIS_URL);
    }
}

export class RateLimiter {
    static async check(ip: string, limit: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }> {
        const key = `ratelimit:${ip}`;
        const current = await redis.incr(key);
        
        if (current === 1) {
            await redis.expire(key, windowSeconds);
        }

        if (current > limit) {
            return { allowed: false, remaining: 0 };
        }

        return { allowed: true, remaining: limit - current };
    }
}
