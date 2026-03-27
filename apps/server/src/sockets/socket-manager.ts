import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { redis } from '../services/redis-service.js';
import { LobbyManager } from '../managers/lobby-manager.js';
import { GameSocketHandler } from './game-handler.js';

export class SocketManager {
    private io: Server;
    private lobbyManager: LobbyManager;
    private gameHandler: GameSocketHandler;

    constructor(io: Server, lobbyManager: LobbyManager) {
        this.io = io;
        this.lobbyManager = lobbyManager;
        this.gameHandler = new GameSocketHandler(io, lobbyManager);
        this.init();
    }

    private async init() {
        const pubClient = redis.duplicate();
        const subClient = redis.duplicate();
        await Promise.all([pubClient.connect(), subClient.connect()]);
        
        this.io.adapter(createAdapter(pubClient, subClient));
        
        this.io.on('connection', (socket: Socket) => {
            console.log(`[SOCKET] Client connected: ${socket.id}`);
            
            // Register Lobby Handlers
            socket.on('create_lobby', (data) => this.handleCreateLobby(socket, data));
            socket.on('join_lobby', (data) => this.handleJoinLobby(socket, data));
            socket.on('leave_lobby', (data) => this.handleLeaveLobby(socket, data));
            
            // Register Game Handlers
            this.gameHandler.setupHandlers(socket);

            socket.on('disconnect', () => {
                console.log(`[SOCKET] Client disconnected: ${socket.id}`);
            });
        });
    }

    private handleCreateLobby(socket: Socket, { playerName, code }: any) {
        const lobby = this.lobbyManager.createLobby(socket.id, playerName, code);
        socket.join(lobby.code);
        socket.emit('lobby_created', lobby);
    }

    private handleJoinLobby(socket: Socket, { code, playerName }: any) {
        const lobby = this.lobbyManager.joinLobby(code, socket.id, playerName);
        if (lobby) {
            socket.join(code);
            this.io.to(code).emit('player_joined', lobby);
        } else {
            socket.emit('error', { message: 'Lobby not found or full' });
        }
    }

    private handleLeaveLobby(socket: Socket, { code }: any) {
        const lobby = this.lobbyManager.leaveLobby(code, socket.id);
        socket.leave(code);
        if (lobby) {
            this.io.to(code).emit('player_joined', lobby);
        }
    }
}
