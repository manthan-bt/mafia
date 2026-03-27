export interface SeasonInfo {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    theme: string;
}

export class SeasonService {
    static getCurrentSeason(): SeasonInfo {
        return {
            id: 'season_1',
            name: 'Nightfall Genesis',
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-03-01'),
            theme: 'Crimson Eclipse'
        };
    }

    static onSeasonEnd(playerMMRs: Record<string, number>): Record<string, number> {
        const resetMMRs: Record<string, number> = {};
        for (const [userId, mmr] of Object.entries(playerMMRs)) {
            // Soft reset formula: (Current MMR + 1000) / 2
            resetMMRs[userId] = Math.floor((mmr + 1000) / 2);
        }
        console.log('Season nightfall genesis has ended. MMR Soft reset complete.');
        // Award seasonal badges
        return resetMMRs;
    }
}
