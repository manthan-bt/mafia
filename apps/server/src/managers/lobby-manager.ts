import { Player } from '@mafia/shared';

export interface Lobby {
    id: string;
    code: string;
    players: Player[];
    isLocked: boolean;
}

export class LobbyManager {
    private lobbies: Map<string, Lobby> = new Map();

    createLobby(hostId: string, hostName: string, preferredCode?: string): Lobby {
        const code = preferredCode && !this.lobbies.has(preferredCode) ? preferredCode : this.generateCode();
        const lobby: Lobby = {
            id: code,
            code,
            players: [
                {
                    id: hostId,
                    name: hostName,
                    isAlive: true,
                    isHost: true,
                },
            ],
            isLocked: false,
        };
        this.lobbies.set(code, lobby);
        return lobby;
    }

    getLobby(code: string): Lobby | undefined {
        return this.lobbies.get(code);
    }

    joinLobby(code: string, playerId: string, playerName: string): Lobby | null {
        const lobby = this.lobbies.get(code);
        if (!lobby || lobby.isLocked || lobby.players.length >= 20) {
            return null;
        }
        const player: Player = {
            id: playerId,
            name: playerName,
            isAlive: true,
            isHost: false,
        };
        lobby.players.push(player);
        return lobby;
    }

    leaveLobby(code: string, playerId: string): Lobby | null {
        const lobby = this.lobbies.get(code);
        if (!lobby) return null;

        lobby.players = lobby.players.filter((p) => p.id !== playerId);
        if (lobby.players.length === 0) {
            this.lobbies.delete(code);
            return null;
        }

        // Transfer host if host left
        if (!lobby.players.some((p) => p.isHost)) {
            lobby.players[0].isHost = true;
        }

        return lobby;
    }

    public generateCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        if (this.lobbies.has(code)) return this.generateCode();
        return code;
    }

    public deleteLobby(code: string): boolean {
        return this.lobbies.delete(code);
    }

    public getAllLobbies(): Lobby[] {
        return Array.from(this.lobbies.values());
    }
}
