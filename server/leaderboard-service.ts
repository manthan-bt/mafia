export interface LeaderboardEntry {
    rank: number;
    username: string;
    mmr: number;
    tier: string;
}

export class LeaderboardService {
    private static globalLeaderboard: LeaderboardEntry[] = [];

    static updateLeaderboard(entries: LeaderboardEntry[]) {
        this.globalLeaderboard = entries.sort((a, b) => b.mmr - a.mmr)
            .map((entry, index) => ({ ...entry, rank: index + 1 }));
    }

    static getTop(limit: number = 100): LeaderboardEntry[] {
        return this.globalLeaderboard.slice(0, limit);
    }
}
