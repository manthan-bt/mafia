import { describe, it, expect } from 'vitest';
import { GameEngine, Role } from './game-engine.js';

describe('GameEngine', () => {
    it('should calculate roles correctly for 7 players', () => {
        const roles = GameEngine.calculateRoles(7);
        expect(roles.length).toBe(7);
        expect(roles.filter(r => r === Role.MAFIA).length).toBe(2); // floor(7 * 0.3)
        expect(roles.filter(r => r === Role.POLICE).length).toBe(1);
        expect(roles.filter(r => r === Role.DOCTOR).length).toBe(1);
        expect(roles.filter(r => r === Role.VILLAGER).length).toBe(3);
    });

    it('should resolve night phase correctly: Mafia kills unprotected', () => {
        const actions = [
            { playerId: 'm1', targetId: 'v1', actionType: 'KILL' },
            { playerId: 'd1', targetId: 'v2', actionType: 'SAVE' },
        ];
        // @ts-expect-error - testing with partial action objects
        const result = GameEngine.resolveNightPhase(actions);
        expect(result.deathId).toBe('v1');
    });

    it('should resolve night phase correctly: Doctor saves victim', () => {
        const actions = [
            { playerId: 'm1', targetId: 'v1', actionType: 'KILL' },
            { playerId: 'd1', targetId: 'v1', actionType: 'SAVE' },
        ];
        // @ts-expect-error - testing with partial action objects
        const result = GameEngine.resolveNightPhase(actions);
        expect(result.deathId).toBeNull();
        expect(result.savedId).toBe('v1');
    });

    it('should check win conditions correctly: Villagers win', () => {
        const players = [
            { id: '1', name: 'v1', role: Role.VILLAGER, isAlive: true, isHost: false },
            { id: '2', name: 'm1', role: Role.MAFIA, isAlive: false, isHost: false },
        ];
        const result = GameEngine.checkWinCondition(players);
        expect(result.winner).toBe('VILLAGERS');
    });

    it('should check win conditions correctly: Mafia wins', () => {
        const players = [
            { id: '1', name: 'v1', role: Role.VILLAGER, isAlive: true, isHost: false },
            { id: '2', name: 'm1', role: Role.MAFIA, isAlive: true, isHost: false },
        ];
        const result = GameEngine.checkWinCondition(players);
        expect(result.winner).toBe('MAFIA');
    });
});
