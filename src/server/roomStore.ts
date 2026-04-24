import {
  addPlayer,
  beginDayDiscussion,
  beginNight,
  beginVoting,
  createGame,
  resolveNight,
  resolveVote,
  setConnected,
  setReady,
  startGame,
  submitNightAction,
  submitVote
} from "../shared/engine";
import type { Game, GameSettings, NightAction } from "../shared/types";

export type RoomMutationResult = {
  game?: Game;
  error?: string;
};

export class RoomStore {
  private rooms = new Map<string, Game>();

  createRoom(host: { id: string; name: string }, settings?: Partial<GameSettings>): Game {
    let game = createGame(host, settings);
    while (this.rooms.has(game.code)) {
      game = createGame(host, settings);
    }
    this.rooms.set(game.code, game);
    return game;
  }

  getRoom(code: string): Game | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  joinRoom(code: string, player: { id: string; name: string }): RoomMutationResult {
    const game = this.getRoom(code);
    if (!game) {
      return { error: "Room not found." };
    }

    const existing = game.players.find((candidate) => candidate.id === player.id);
    if (existing) {
      const result = setConnected(game, player.id, true);
      this.rooms.set(game.code, result.game);
      return result;
    }

    const result = addPlayer(game, player);
    this.rooms.set(game.code, result.game);
    return result;
  }

  setReady(code: string, playerId: string, ready: boolean): RoomMutationResult {
    return this.update(code, (game) => setReady(game, playerId, ready));
  }

  startGame(code: string, hostId: string): RoomMutationResult {
    return this.update(code, (game) => startGame(game, hostId));
  }

  submitNightAction(code: string, action: NightAction): RoomMutationResult {
    return this.update(code, (game) => submitNightAction(game, action));
  }

  submitVote(code: string, voterId: string, targetId: string): RoomMutationResult {
    return this.update(code, (game) => submitVote(game, voterId, targetId));
  }

  disconnect(code: string, playerId: string): RoomMutationResult {
    return this.update(code, (game) => setConnected(game, playerId, false));
  }

  advance(code: string, requesterId: string): RoomMutationResult {
    const game = this.getRoom(code);
    if (!game) {
      return { error: "Room not found." };
    }

    if (game.hostId !== requesterId) {
      return { game, error: "Only the host can advance the phase." };
    }

    if (game.phase === "roleReveal" || game.phase === "elimination") {
      return this.update(code, beginNight);
    }
    if (game.phase === "night") {
      return this.update(code, resolveNight);
    }
    if (game.phase === "nightResolution") {
      return this.update(code, beginDayDiscussion);
    }
    if (game.phase === "dayDiscussion") {
      return this.update(code, beginVoting);
    }
    if (game.phase === "voting") {
      return this.update(code, resolveVote);
    }

    return { game, error: "This phase cannot be advanced manually." };
  }

  private update(code: string, mutate: (game: Game) => RoomMutationResult): RoomMutationResult {
    const game = this.getRoom(code);
    if (!game) {
      return { error: "Room not found." };
    }

    const result = mutate(game);
    if (result.game) {
      this.rooms.set(result.game.code, result.game);
    }
    return result;
  }
}
