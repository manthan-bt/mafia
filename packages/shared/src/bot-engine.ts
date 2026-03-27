import { Role, PlayerAction, GameState, Player } from './game-engine.js';

export enum BotDifficulty {
    EASY = 'EASY',
    MEDIUM = 'MEDIUM',
    HARD = 'HARD'
}

export class BotEngine {
    static decideAction(
        bot: Player,
        gameState: GameState,
        allPlayers: Player[],
        difficulty: BotDifficulty = BotDifficulty.MEDIUM
    ): PlayerAction | null {
        if (gameState !== GameState.NIGHT_PHASE || !bot.isAlive) return null;

        const targets = allPlayers.filter(p => p.id !== bot.id && p.isAlive);
        if (targets.length === 0) return null;

        let targetId: string;

        if (difficulty === BotDifficulty.HARD) {
            targetId = this.decideTacticalTarget(bot, targets);
        } else if (difficulty === BotDifficulty.MEDIUM) {
            // Medium bots avoid targeting own team if Mafia
            const validTargets = bot.role === Role.MAFIA
                ? targets.filter(t => t.role !== Role.MAFIA)
                : targets;
            targetId = (validTargets.length > 0 ? validTargets : targets)[Math.floor(Math.random() * (validTargets.length || targets.length))].id;
        } else {
            targetId = targets[Math.floor(Math.random() * targets.length)].id;
        }

        return {
            playerId: bot.id,
            targetId,
            actionType: bot.role === Role.MAFIA ? 'KILL' : bot.role === Role.POLICE ? 'INVESTIGATE' : 'SAVE'
        };
    }

    private static decideTacticalTarget(bot: Player, targets: Player[]): string {
        switch (bot.role) {
            case Role.MAFIA:
                // Mafia targets quiet players or suspected "Power Roles"
                return targets.sort((a, b) => (bot.suspicionMap?.[b.id] || 0) - (bot.suspicionMap?.[a.id] || 0))[0]?.id || targets[0].id;
            case Role.POLICE:
                // Police targets most suspicious non-investigated
                return targets.sort((a, b) => (bot.suspicionMap?.[b.id] || 0) - (bot.suspicionMap?.[a.id] || 0))[0]?.id || targets[0].id;
            case Role.DOCTOR: {
                // Doctor saves themselves or least suspicious (likely good) players
                const self = targets.find(t => t.id === bot.id);
                if (self && Math.random() > 0.7) return self.id;
                return targets.sort((a, b) => (bot.suspicionMap?.[a.id] || 0) - (bot.suspicionMap?.[b.id] || 0))[0]?.id || targets[0].id;
            }
            default:
                return targets[Math.floor(Math.random() * targets.length)].id;
        }
    }

    static decideVote(bot: Player, players: Player[]): string | null {
        const targets = players.filter(p => p.id !== bot.id && p.isAlive);
        if (targets.length === 0) return null;

        // Mafia almost never vote each other unless necessary
        const validTargets = bot.role === Role.MAFIA
            ? targets.filter(t => t.role !== Role.MAFIA)
            : targets;

        const finalCandidates = validTargets.length > 0 ? validTargets : targets;

        // Vote for highest suspicion
        const sorted = [...finalCandidates].sort((a, b) =>
            (bot.suspicionMap?.[b.id] || 0) - (bot.suspicionMap?.[a.id] || 0)
        );

        return sorted[0]?.id || null;
    }

    static generateChatMessage(bot: Player, gameState: GameState): string {
        const personality = bot.personality || 'ANALYTICAL';

        const discussionPhase = {
            AGGRESSIVE: ["I'm 100% sure someone here is lying.", "Let's stop talking and start voting.", "Why is everyone so quiet?"],
            DEFENSIVE: ["I was just doing my job last night.", "Don't look at me, I'm clean.", "I promise I'm on your side."],
            ANALYTICAL: ["The patterns from last night are interesting.", "We should compare who voted for whom.", "Let's cross-reference the claims."],
            QUIET: ["Stay sharp.", "The Mafia is still among us.", "..."]
        };

        const votingPhase = {
            AGGRESSIVE: ["Time to pay.", "No mercy for the guilty.", "Die, scumbag."],
            DEFENSIVE: ["I hope this is the right call.", "Safety first.", "Trusting my gut."],
            ANALYTICAL: ["Logic dictates this choice.", "Based on the evidence...", "Highest probability target selected."],
            QUIET: ["Voted.", "Done.", "Protocol followed."]
        };

        let pool: string[];
        if (gameState === GameState.DISCUSSION_PHASE) {
            pool = (discussionPhase as any)[personality] || discussionPhase.QUIET;
        } else if (gameState === GameState.VOTING_PHASE) {
            pool = (votingPhase as any)[personality] || votingPhase.QUIET;
        } else {
            pool = ["..."];
        }

        return pool[Math.floor(Math.random() * pool.length)];
    }
}
