import { Role } from './game-engine.js';

export interface PerformanceMetrics {
    survived: boolean;
    votingAccuracy: number; // Accuracy in identifying mafia
    roleEfficiency: number; // Hits/Saves ratio
    deceptionSuccess?: number; // For Mafia
}

export class MMRService {
    private static BASE_GAIN = 25;
    private static BASE_LOSS = -20;
    private static MAX_MODIFIER = 15;

    static calculateMMRChange(
        playerRank: number,
        lobbyAvgRank: number,
        isWin: boolean,
        metrics: PerformanceMetrics
    ): number {
        let change = isWin ? this.BASE_GAIN : this.BASE_LOSS;

        // Rank difference adjustment
        const rankDiff = lobbyAvgRank - playerRank;
        change += Math.round(rankDiff * 0.05);

        // Performance adjustment
        let modifier = 0;
        if (metrics.survived) modifier += 2;
        modifier += Math.floor(metrics.votingAccuracy * 5);
        modifier += Math.floor(metrics.roleEfficiency * 5);

        if (isWin) {
            change += Math.min(modifier, this.MAX_MODIFIER);
        } else {
            change -= Math.max(0, 5 - modifier); // Lessen loss if performed well
        }

        return Math.max(-40, Math.min(40, change));
    }

    static getTier(mmr: number): string {
        if (mmr < 1200) return 'BRONZE';
        if (mmr < 1500) return 'SILVER';
        if (mmr < 1800) return 'GOLD';
        if (mmr < 2200) return 'PLATINUM';
        if (mmr < 2600) return 'DIAMOND';
        if (mmr < 3000) return 'ELITE';
        if (mmr < 3500) return 'MASTERMIND';
        return 'NIGHTFALL_LEGEND';
    }
}
