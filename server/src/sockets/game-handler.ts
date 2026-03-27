import { Server, Socket } from 'socket.io';
import { LobbyManager } from '../../lobby-manager.js';
import { GameEngine, GameState, PlayerAction, Player, Role } from '../../../shared/game-engine.js';
import { BotManager } from '../../bot-manager.js';
import { EncryptionService } from '../../../shared/encryption-service.js';
import { MMRService } from '../../../shared/mmr-service.js';
import { MonetizationService } from '../../monetization-service.js';
import { AuthService } from '../services/auth-service.js';

export class GameSocketHandler {
    private io: Server;
    private lobbyManager: LobbyManager;

    constructor(io: Server, lobbyManager: LobbyManager) {
        this.io = io;
        this.lobbyManager = lobbyManager;
    }

    public setupHandlers(socket: Socket) {
        socket.on('start_game', ({ code }) => this.handleStartGame(socket, code));
        socket.on('submit_action', ({ code, action }) => this.handleActionSubmission(socket, code, action));
        socket.on('submit_vote', ({ code, targetId }) => this.handleVoteSubmission(socket, code, targetId));
        socket.on('send_message', (data) => this.handleChatMessage(socket, data));
        socket.on('game_finished', (data) => this.handleGameFinished(socket, data));
    }

    private handleStartGame(socket: Socket, code: string) {
        const lobby = this.lobbyManager.getLobby(code);
        if (!lobby) return;

        const hostPlayer = lobby.players.find(p => p.id === socket.id && p.isHost);
        if (!hostPlayer) return;

        if (lobby.players.length < 6) {
            BotManager.fillWithBots(lobby, 6);
            this.io.to(code).emit('player_joined', lobby);
        }

        const roles = GameEngine.calculateRoles(lobby.players.length);
        lobby.players.forEach((player, index) => {
            player.role = roles[index];
        });

        const key = (lobby as any).encryptionKey;
        this.io.to(code).emit('game_started', { code });

        setTimeout(() => {
            lobby.players.forEach((player) => {
                if (!player.id.startsWith('bot_')) {
                    this.io.to(player.id).emit('game_state_changed', {
                        gameState: GameState.ROLE_REVEAL,
                        encryptionKey: key,
                        players: lobby.players,
                        yourRole: player.role,
                    });
                }
            });
        }, 800);

        setTimeout(() => {
            this.io.to(code).emit('game_state_changed', { gameState: GameState.NIGHT_PHASE, players: lobby.players });
            BotManager.handleBotActions(this.io, lobby, GameState.NIGHT_PHASE, (id, action) => {
                this.handleActionSubmission(socket, code, action, id);
            });
        }, 6000);
    }

    private handleActionSubmission(socket: Socket, code: string, action: PlayerAction, botId?: string) {
        const lobby = this.lobbyManager.getLobby(code);
        if (!lobby) return;

        const playerId = botId || socket.id;
        const actions = this.getLobbyActions(lobby);
        actions.set(playerId, action);

        const specializedAlive = lobby.players.filter(p => p.isAlive && p.role !== Role.VILLAGER).length;

        if (actions.size >= specializedAlive) {
            const result = GameEngine.resolveNightPhase(Array.from(actions.values()));
            if (result.deathId) {
                const deadPlayer = lobby.players.find(p => p.id === result.deathId);
                if (deadPlayer) deadPlayer.isAlive = false;
            }

            this.io.to(code).emit('night_resolved', result);
            const winResult = GameEngine.checkWinCondition(lobby.players);

            if (winResult.winner) {
                this.io.to(code).emit('game_over', { winner: winResult.winner });
            } else {
                this.io.to(code).emit('game_state_changed', { gameState: GameState.DISCUSSION_PHASE });
                setTimeout(() => {
                    this.io.to(code).emit('game_state_changed', { gameState: GameState.VOTING_PHASE });
                    BotManager.handleBotVotes(this.io, lobby, (id, targetId) => {
                        this.handleVoteSubmission(socket, code, targetId, id);
                    });
                }, 10000);
            }
            actions.clear();
        }
    }

    private handleVoteSubmission(socket: Socket, code: string, targetId: string, botId?: string) {
        const lobby = this.lobbyManager.getLobby(code);
        if (!lobby) return;

        const voterId = botId || socket.id;
        const votes = this.getLobbyVotes(lobby);
        votes.set(voterId, targetId);

        const alivePlayers = lobby.players.filter(p => p.isAlive);
        if (votes.size >= alivePlayers.length) {
            const voteCounts: Record<string, number> = {};
            votes.forEach(target => voteCounts[target] = (voteCounts[target] || 0) + 1);

            const sortedVotes = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
            if (sortedVotes.length > 0 && sortedVotes[0][1] > 0) {
                const player = lobby.players.find(p => p.id === sortedVotes[0][0]);
                if (player) player.isAlive = false;
            }

            this.io.to(code).emit('voting_resolved', { eliminatedId: sortedVotes[0]?.[0], voteCounts });
            votes.clear();

            setTimeout(() => {
                const winResult = GameEngine.checkWinCondition(lobby.players);
                if (winResult.winner) {
                    this.io.to(code).emit('game_over', { winner: winResult.winner });
                } else {
                    this.io.to(code).emit('game_state_changed', { gameState: GameState.NIGHT_PHASE });
                }
            }, 4000);
        }
    }

    private handleChatMessage(socket: Socket, { code, sender, content }: any) {
        this.io.to(code).emit('chat_message', { sender, senderId: socket.id, content, isBot: false });
    }

    private handleGameFinished(socket: Socket, { code, winner }: any) {
        const lobby = this.lobbyManager.getLobby(code);
        if (!lobby) return;
        // Persistence logic for stats (as seen in original server.ts)
        this.lobbyManager.deleteLobby(code);
    }

    private getLobbyActions(lobby: any): Map<string, PlayerAction> {
        if (!lobby._actions) lobby._actions = new Map();
        return lobby._actions;
    }

    private getLobbyVotes(lobby: any): Map<string, string> {
        if (!lobby._votes) lobby._votes = new Map();
        return lobby._votes;
    }
}
