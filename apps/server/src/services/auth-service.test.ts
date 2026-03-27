import { describe, it, expect, vi } from 'vitest';
import { AuthService } from './auth-service.js';

// Mock Prisma
vi.mock('../lib/prisma.js', () => ({
    prisma: {
        user: {
            findFirst: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
        }
    }
}));

describe('AuthService', () => {
    it('should hash passwords consistently', () => {
        const password = 'test-password';
        const salt = 'test-salt';
        const hash1 = AuthService.hashPassword(password, salt);
        const hash2 = AuthService.hashPassword(password, salt);
        expect(hash1).toBe(hash2);
        expect(hash1).not.toBe(password);
    });

    it('should generate a 64-character hex salt', () => {
        const salt = AuthService.generateSalt();
        expect(salt).toHaveLength(64);
        expect(/^[0-9a-f]+$/.test(salt)).toBe(true);
    });

    it('should verify valid tokens', () => {
        const user = { id: 'user-1', username: 'test-user' };
        // Access private method for testing or use a mock
        // @ts-expect-error - issueToken is private but we need to test verification logic
        const token = AuthService.issueToken(user.id, user.username, 'USER');
        const session = AuthService.verifyToken(token);
        
        expect(session).not.toBeNull();
        expect(session?.userId).toBe(user.id);
        expect(session?.alias).toBe(user.username);
    });
});
