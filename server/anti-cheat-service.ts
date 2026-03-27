export interface MatchHistoryEntry {
    playerId: string;
    lobbyId: string;
    ip: string;
    targetId?: string;
    voteId?: string;
    role: string;
    isWinner: boolean;
}

export class AntiCheatService {
    private static IP_LIMIT = 2; // Flag if > 2 players on same IP in same lobby
    private static CORRELATION_THRESHOLD = 0.8; // Flag if players vote together 80% of time

    static analyzeMatch(history: MatchHistoryEntry[]): any[] {
        const flags: any[] = [];

        // 1. IP Check
        const ipGroups = this.groupBy(history, 'ip');
        Object.entries(ipGroups).forEach(([ip, players]: [string, any]) => {
            if (players.length > this.IP_LIMIT) {
                flags.push({ type: 'IP_COLLUSION', ip, playerIds: players.map((p: any) => p.playerId) });
            }
        });

        // 2. Target/Vote Correlation
        // This would ideally look across multiple matches in a real DB, 
        // but for single match analysis:
        const mafias = history.filter(p => p.role === 'MAFIA');
        const villagers = history.filter(p => p.role === 'VILLAGER');

        // Check if Mafia consistently avoids targeting specific Villagers (Teaming)
        return flags;
    }

    private static groupBy(arr: any[], key: string) {
        return arr.reduce((storage, item) => {
            const group = item[key];
            storage[group] = storage[group] || [];
            storage[group].push(item);
            return storage;
        }, {} as any);
    }
}
