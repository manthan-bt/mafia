export interface TournamentBracket {
    id: string;
    rounds: TournamentRound[];
    winnerId?: string;
}

export interface TournamentRound {
    matches: string[]; // Lobby codes
    winnerIds: string[];
}

export class TournamentService {
    static createBracket(playerIds: string[]): TournamentBracket {
        const rounds: TournamentRound[] = [];
        let currentPlayers = [...playerIds];

        while (currentPlayers.length > 1) {
            const matchCount = Math.floor(currentPlayers.length / 2);
            rounds.push({ matches: [], winnerIds: [] });
            // Logic for building lobbies would go here
            currentPlayers = currentPlayers.slice(0, matchCount); // Simplified
        }

        return { id: Math.random().toString(36).substr(2, 9), rounds };
    }
}
