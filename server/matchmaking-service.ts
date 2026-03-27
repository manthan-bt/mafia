import { Server } from 'socket.io';

interface QueuePlayer {
    id: string;
    name: string;
    mmr: number;
    joinedAt: number;
}

export class MatchmakingService {
    private rankedQueue: QueuePlayer[] = [];
    private casualQueue: QueuePlayer[] = [];
    private MMR_THRESHOLD = 200;
    private EXPANSION_RATE = 50; // MMR range increases every 10 seconds

    addToQueue(playerId: string, mmr: number, mode: 'RANKED' | 'CASUAL', playerName: string) {
        const player = { id: playerId, name: playerName, mmr, joinedAt: Date.now() };
        if (mode === 'RANKED') {
            this.rankedQueue.push(player);
        } else {
            this.casualQueue.push(player);
        }
    }

    findMatches(): QueuePlayer[][] {
        const matches: QueuePlayer[][] = [];
        this.processQueue(this.rankedQueue, matches, true);
        this.processQueue(this.casualQueue, matches, false);
        return matches;
    }

    private processQueue(queue: QueuePlayer[], matches: QueuePlayer[][], useMMR: boolean) {
        queue.sort((a, b) => a.mmr - b.mmr);

        while (queue.length >= 6) {
            const lobbySize = Math.min(queue.length, 15);
            const potentialMatch = queue.slice(0, lobbySize);

            if (useMMR) {
                const avgMMR = potentialMatch.reduce((sum, p) => sum + p.mmr, 0) / lobbySize;
                const waitTime = (Date.now() - potentialMatch[0].joinedAt) / 1000;
                const currentThreshold = this.MMR_THRESHOLD + (Math.floor(waitTime / 10) * this.EXPANSION_RATE);

                const isMatchValid = potentialMatch.every(p => Math.abs(p.mmr - avgMMR) <= currentThreshold);

                if (isMatchValid) {
                    matches.push(queue.splice(0, lobbySize));
                } else {
                    break;
                }
            } else {
                matches.push(queue.splice(0, lobbySize));
            }
        }
    }

    removeFromQueue(playerId: string) {
        this.rankedQueue = this.rankedQueue.filter(p => p.id !== playerId);
        this.casualQueue = this.casualQueue.filter(p => p.id !== playerId);
    }
}
