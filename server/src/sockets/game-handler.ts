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

    private phaseTimers: Map<string, NodeJS.Timeout> = new Map();
    private readonly PHASE_TIMEOUTS = {
        [GameState.DISCUSSION_PHASE]: 60000, // 60s
        [GameState.VOTING_PHASE]: 30000,     // 30s
        [GameState.NIGHT_PHASE]: 30000,      // 30s
    };

    public setupHandlers(socket: Socket) {
        socket.on('start_game', ({ code }) => this.handleStartGame(socket, code));
        socket.on('submit_action', ({ code, action }) => this.handleActionSubmission(socket, code, action));
        socket.on('submit_vote', ({ code, targetId }) => this.handleVoteSubmission(socket, code, targetId));
        socket.on('send_message', (data) => this.handleChatMessage(socket, data));
        socket.on('game_finished', (data) => this.handleGameFinished(socket, data));
        socket.on('disconnect', () => this.handleDisconnect(socket));
    }

    private startPhaseTimer(code: string, gameState: GameState, callback: () => void) {
        this.clearPhaseTimer(code);
        const timeout = this.PHASE_TIMEOUTS[gameState as keyof typeof this.PHASE_TIMEOUTS];
        if (timeout) {
            const timer = setTimeout(() => {
                console.log(`[GAME] Phase timeout for lobby ${code} in state ${gameState}`);
                callback();
            }, timeout);
            this.phaseTimers.set(code, timer);
        }
    }

    private clearPhaseTimer(code: string) {
        const timer = this.phaseTimers.get(code);
        if (timer) {
            clearTimeout(timer);
            this.phaseTimers.delete(code);
        }
    }

    private handleDisconnect(socket: Socket) {
        // Find all lobbies where this player was active
        const lobbies = this.lobbyManager.getAllLobbies();
        for (const lobby of lobbies) {
            const playerIndex = lobby.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                const player = lobby.players[playerIndex];
                console.log(`[GAME] Player ${player.name} (${socket.id}) disconnected from lobby ${lobby.code}`);
                
                // Mark as dead if game is in progress
                if (player.isAlive) {
                    player.isAlive = false;
                    this.io.to(lobby.code).emit('chat_message', {
                        sender: 'SYSTEM',
                        content: `${player.name} has abandoned the operation and is considered lost.`,
                        isSystem: true
                    });
                    
                    // Check if this disconnection triggers a win or phase resolution
                    this.checkPhaseResolutions(lobby.code);
                }
            }
        }
    }

    private checkPhaseResolutions(code: string) {
        const lobby = this.lobbyManager.getLobby(code);
        if (!lobby) return;

        const winResult = GameEngine.checkWinCondition(lobby.players);
        if (winResult.winner) {
            this.io.to(code).emit('game_over', { winner: winResult.winner });
            this.clearPhaseTimer(code);
            return;
        }

        // Logic to force progress if waiting for this player's action/vote
        // This is handled implicitly by handleActionSubmission/handleVoteSubmission 
        // if we re-check specializedAlive/alivePlayers counts
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
            this.changePhase(code, GameState.NIGHT_PHASE);
        }, 6000);
    }

    private changePhase(code: string, nextState: GameState) {
        const lobby = this.lobbyManager.getLobby(code);
        if (!lobby) return;

        this.io.to(code).emit('game_state_changed', { gameState: nextState, players: lobby.players });

        if (nextState === GameState.NIGHT_PHASE) {
            BotManager.handleBotActions(this.io, lobby, GameState.NIGHT_PHASE, (id, action) => {
                this.handleActionSubmission(null as any, code, action, id);
            });
            this.startPhaseTimer(code, GameState.NIGHT_PHASE, () => this.forceResolveNight(code));
        } else if (nextState === GameState.VOTING_PHASE) {
            BotManager.handleBotVotes(this.io, lobby, (id, targetId) => {
                this.handleVoteSubmission(null as any, code, targetId, id);
            });
            this.startPhaseTimer(code, GameState.VOTING_PHASE, () => this.forceResolveVote(code));
        } else if (nextState === GameState.DISCUSSION_PHASE) {
            this.startPhaseTimer(code, GameState.DISCUSSION_PHASE, () => this.changePhase(code, GameState.VOTING_PHASE));
        }
    }

    private forceResolveNight(code: string) {
        const lobby = this.lobbyManager.getLobby(code);
        if (!lobby) return;
        const actions = this.getLobbyActions(lobby);
        // If actions missing, treat as "no action" for that player
        this.resolveNight(code, Array.from(actions.values()));
    }

    private forceResolveVote(code: string) {
        const lobby = this.lobbyManager.getLobby(code);
        if (!lobby) return;
        this.resolveVote(code);
    }

    private handleActionSubmission(socket: Socket, code: string, action: PlayerAction, botId?: string) {
        const lobby = this.lobbyManager.getLobby(code);
        if (!lobby) return;

        const playerId = botId || socket.id;
        const actions = this.getLobbyActions(lobby);
        actions.set(playerId, action);

        const specializedAlive = lobby.players.filter(p => p.isAlive && p.role !== Role.VILLAGER).length;

        if (actions.size >= specializedAlive) {
            this.resolveNight(code, Array.from(actions.values()));
        }
    }

    private resolveNight(code: string, actionList: PlayerAction[]) {
        const lobby = this.lobbyManager.getLobby(code);
        if (!lobby) return;

        this.clearPhaseTimer(code);
        const actions = this.getLobbyActions(lobby);
        const result = GameEngine.resolveNightPhase(actionList);
        
        if (result.deathId) {
            const deadPlayer = lobby.players.find(p => p.id === result.deathId);
            if (deadPlayer) deadPlayer.isAlive = false;
        }

        this.io.to(code).emit('night_resolved', result);
        const winResult = GameEngine.checkWinCondition(lobby.players);

        if (winResult.winner) {
            this.io.to(code).emit('game_over', { winner: winResult.winner });
        } else {
            this.changePhase(code, GameState.DISCUSSION_PHASE);
        }
        actions.clear();
    }

    private handleVoteSubmission(socket: Socket, code: string, targetId: string, botId?: string) {
        const lobby = this.lobbyManager.getLobby(code);
        if (!lobby) return;

        const voterId = botId || socket.id;
        const votes = this.getLobbyVotes(lobby);
        votes.set(voterId, targetId);

        const alivePlayers = lobby.players.filter(p => p.isAlive);
        if (votes.size >= alivePlayers.length) {
            this.resolveVote(code);
        }
    }

    private resolveVote(code: string) {
        const lobby = this.lobbyManager.getLobby(code);
        if (!lobby) return;

        this.clearPhaseTimer(code);
        const votes = this.getLobbyVotes(lobby);
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
                this.changePhase(code, GameState.NIGHT_PHASE);
            }
        }, 4000);
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
