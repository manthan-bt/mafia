import { Role, PlayerAction, GameState, Player } from '@mafia/shared';
import { BotEngine, BotDifficulty } from '@mafia/shared';
import { Server } from 'socket.io';

export class BotManager {
    static fillWithBots(lobby: any, targetCount: number = 6) {
        const currentCount = lobby.players.length;
        const botsNeeded = targetCount - currentCount;

        const botNames = [
            'Spectre.01', 'Viper_X', 'Shadow.Unit', 'Ghost.Echo',
            'Phantom_7', 'Reaper.exe', 'Stalker_V', 'Wraith_0',
            'Cipher.9', 'Omen_404', 'Zero.Point', 'Eclipse_X',
        ];

        const personalities: ('AGGRESSIVE' | 'DEFENSIVE' | 'ANALYTICAL' | 'QUIET')[] = ['AGGRESSIVE', 'DEFENSIVE', 'ANALYTICAL', 'QUIET'];

        for (let i = 0; i < botsNeeded; i++) {
            const botId = `bot_${Math.random().toString(36).substr(2, 5)}`;
            const name = botNames[Math.floor(Math.random() * botNames.length)] || `Bot ${i + 1}`;

            lobby.players.push({
                id: botId,
                name,
                isHost: false,
                isAlive: true,
                role: Role.VILLAGER,
                personality: personalities[Math.floor(Math.random() * personalities.length)],
                suspicionMap: {},
            } as Player);
        }
    }

    /** Updates suspicion levels for all alive bots based on a significant game event */
    static updateSuspicion(lobby: any, eventType: 'DEATH' | 'VOTE' | 'CLAIM', data: any) {
        const bots = (lobby.players as Player[]).filter(p => p.id.startsWith('bot_') && p.isAlive);

        bots.forEach(bot => {
            if (!bot.suspicionMap) bot.suspicionMap = {};

            switch (eventType) {
                case 'DEATH':
                    // If a non-mafia player dies, increase suspicion of active voters/chatters
                    (lobby.players as Player[]).filter(p => p.isAlive && p.id !== bot.id).forEach(p => {
                        bot.suspicionMap![p.id] = (bot.suspicionMap![p.id] || 0) + Math.random() * 15;
                    });
                    break;
                case 'VOTE':
                    // Increase suspicion of the person being voted for (if bot is not Mafia)
                    if (bot.role !== Role.MAFIA) {
                        bot.suspicionMap![data.targetId] = (bot.suspicionMap![data.targetId] || 0) + 10;
                    }
                    break;
            }

            // Cap suspicion at 100
            Object.keys(bot.suspicionMap!).forEach(id => {
                if (bot.suspicionMap![id] > 100) bot.suspicionMap![id] = 100;
            });
        });
    }

    static async handleBotActions(
        io: Server,
        lobby: any,
        gameState: GameState,
        submitAction: (id: string, action: PlayerAction) => void,
        difficultyStr?: string
    ) {
        if (gameState !== GameState.NIGHT_PHASE) return;

        const diff: BotDifficulty =
            difficultyStr === 'EASY' ? BotDifficulty.EASY :
                difficultyStr === 'HARD' ? BotDifficulty.HARD :
                    BotDifficulty.MEDIUM;

        const bots = (lobby.players as any[]).filter(
            (p: any) => p.id.startsWith('bot_') && p.isAlive
        );

        for (const bot of bots) {
            if (bot.role === Role.VILLAGER) continue;

            const delay = diff === BotDifficulty.HARD
                ? Math.random() * 1000 + 500
                : diff === BotDifficulty.EASY
                    ? Math.random() * 3000 + 2000
                    : Math.random() * 2000 + 1000;

            await new Promise<void>((r) => setTimeout(r, delay));

            const action = BotEngine.decideAction(bot, gameState, lobby.players, diff);
            if (action) submitAction(bot.id, action);
        }
    }

    static async handleBotVotes(
        io: Server,
        lobby: any,
        submitVote: (id: string, targetId: string) => void
    ) {
        const bots = (lobby.players as Player[]).filter(p => p.id.startsWith('bot_') && p.isAlive);

        for (const bot of bots) {
            // Human-like staggered voting delay
            const delay = Math.random() * 6000 + 3000;
            await new Promise<void>((r) => setTimeout(r, delay));

            const targetId = BotEngine.decideVote(bot, lobby.players);
            if (targetId) {
                submitVote(bot.id, targetId);
                this.updateSuspicion(lobby, 'VOTE', { voterId: bot.id, targetId });
            }
        }
    }

    static generateChatMessage(bot: Player, gameState: GameState): string {
        return BotEngine.generateChatMessage(bot, gameState);
    }
}
