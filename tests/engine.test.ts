import { describe, expect, it } from "vitest";
import {
  addPlayer,
  beginDayDiscussion,
  beginNight,
  beginVoting,
  checkWinCondition,
  createGame,
  resolveNight,
  resolveVote,
  setReady,
  startGame,
  submitNightAction,
  submitVote
} from "../src/shared/engine";
import { getRoleCount } from "../src/shared/roles";
import type { Game, Player, Role } from "../src/shared/types";

function player(id: string, role: Role, alive = true): Player {
  return {
    id,
    role,
    alive,
    name: id,
    isHost: id === "p1",
    isReady: true,
    isConnected: true,
    isBot: false,
    joinedAt: 1
  };
}

function fixedGame(players: Player[], phase: Game["phase"] = "night"): Game {
  return {
    id: "game",
    code: "ROOM1",
    phase,
    settings: {
      minPlayers: 5,
      maxPlayers: 30,
      discussionSeconds: 1,
      votingSeconds: 1,
      votingMode: "majority",
      revealRolesOnDeath: true,
      classicRolesEnabled: true,
      botsEnabled: false,
      botOnly: false,
      botDifficulty: "normal"
    },
    players,
    hostId: "p1",
    dayNumber: 0,
    nightNumber: 1,
    nightActions: [],
    votes: {},
    chat: [],
    events: []
  };
}

describe("role scaling", () => {
  it("uses the requested scaling table", () => {
    expect(getRoleCount(5)).toMatchObject({ mafia: 1, detective: 1, doctor: 0, villager: 3 });
    expect(getRoleCount(7)).toMatchObject({ mafia: 2, detective: 1, doctor: 1, villager: 3 });
    expect(getRoleCount(14)).toMatchObject({ mafia: 3, godfather: 1, roleblocker: 1, detective: 1, doctor: 1, villager: 5 });
    expect(getRoleCount(30)).toMatchObject({ mafia: 5, godfather: 1, roleblocker: 1, serialKiller: 1, jester: 1, villager: 17 });
  });
});

describe("game setup", () => {
  it("assigns exactly one role to each player at start", () => {
    let game = createGame({ id: "p1", name: "P1" });
    for (let index = 2; index <= 7; index += 1) {
      game = addPlayer(game, { id: `p${index}`, name: `P${index}` }).game;
      game = setReady(game, `p${index}`, true).game;
    }

    const result = startGame(game, "p1", () => 0.42);

    expect(result.error).toBeUndefined();
    expect(result.game.phase).toBe("roleReveal");
    expect(result.game.players.every((candidate) => candidate.role)).toBe(true);
    expect(result.game.players.filter((candidate) => candidate.role === "mafia")).toHaveLength(2);
    expect(result.game.players.filter((candidate) => candidate.role === "doctor")).toHaveLength(1);
    expect(result.game.players.filter((candidate) => candidate.role === "detective")).toHaveLength(1);
  });
});

describe("night resolution", () => {
  it("lets the doctor save the mafia target", () => {
    let game = fixedGame([
      player("p1", "mafia"),
      player("p2", "doctor"),
      player("p3", "detective"),
      player("p4", "villager"),
      player("p5", "villager")
    ]);

    game = submitNightAction(game, { actorId: "p1", type: "mafiaKill", targetId: "p4" }).game;
    game = submitNightAction(game, { actorId: "p2", type: "protect", targetId: "p4" }).game;
    const resolved = resolveNight(game).game;

    expect(resolved.players.find((candidate) => candidate.id === "p4")?.alive).toBe(true);
    expect(resolved.lastNightResolution?.savedPlayerId).toBe("p4");
    expect(resolved.lastNightResolution?.killedPlayerId).toBeUndefined();
  });

  it("returns detective investigation results privately", () => {
    let game = fixedGame([
      player("p1", "mafia"),
      player("p2", "doctor"),
      player("p3", "detective"),
      player("p4", "villager"),
      player("p5", "villager")
    ]);

    game = submitNightAction(game, { actorId: "p3", type: "investigate", targetId: "p1" }).game;
    const resolved = resolveNight(game).game;

    expect(resolved.lastNightResolution?.investigationResults).toEqual([
      { actorId: "p3", targetId: "p1", result: "mafia", night: 1 }
    ]);
  });

  it("lets the godfather read as town", () => {
    let game = fixedGame([
      player("p1", "godfather"),
      player("p2", "doctor"),
      player("p3", "detective"),
      player("p4", "villager"),
      player("p5", "villager")
    ]);

    game = submitNightAction(game, { actorId: "p3", type: "investigate", targetId: "p1" }).game;
    const resolved = resolveNight(game).game;

    expect(resolved.lastNightResolution?.investigationResults[0].result).toBe("town");
  });

  it("lets roleblocker stop a night action", () => {
    let game = fixedGame([
      player("p1", "roleblocker"),
      player("p2", "doctor"),
      player("p3", "detective"),
      player("p4", "mafia"),
      player("p5", "villager")
    ]);

    game = submitNightAction(game, { actorId: "p1", type: "roleblock", targetId: "p2" }).game;
    game = submitNightAction(game, { actorId: "p4", type: "mafiaKill", targetId: "p5" }).game;
    const blockedDoctor = submitNightAction(game, { actorId: "p2", type: "protect", targetId: "p5" });

    expect(blockedDoctor.error).toBe("That player is blocked tonight.");
    expect(resolveNight(blockedDoctor.game).game.players.find((candidate) => candidate.id === "p5")?.alive).toBe(false);
  });
});

describe("voting and wins", () => {
  it("eliminates by majority vote", () => {
    let game = fixedGame(
      [
        player("p1", "mafia"),
        player("p2", "doctor"),
        player("p3", "detective"),
        player("p4", "villager"),
        player("p5", "villager")
      ],
      "voting"
    );

    game = submitVote(game, "p2", "p1").game;
    game = submitVote(game, "p3", "p1").game;
    game = submitVote(game, "p4", "p1").game;
    const result = resolveVote(game);

    expect(result.eliminatedPlayerId).toBe("p1");
    expect(result.game.phase).toBe("gameOver");
    expect(result.game.winner).toBe("town");
  });

  it("does not eliminate on a tie", () => {
    let game = fixedGame(
      [
        player("p1", "mafia"),
        player("p2", "mafia"),
        player("p3", "detective"),
        player("p4", "doctor"),
        player("p5", "villager"),
        player("p6", "villager")
      ],
      "voting"
    );

    game = submitVote(game, "p1", "p3").game;
    game = submitVote(game, "p2", "p4").game;
    game = submitVote(game, "p3", "p1").game;
    game = submitVote(game, "p4", "p2").game;
    const result = resolveVote(game);

    expect(result.eliminatedPlayerId).toBeUndefined();
    expect(result.game.players.every((candidate) => candidate.alive)).toBe(true);
  });

  it("detects mafia parity", () => {
    const game = fixedGame([
      player("p1", "mafia"),
      player("p2", "mafia"),
      player("p3", "detective"),
      player("p4", "villager", false)
    ]);

    expect(checkWinCondition(game)).toBe("mafia");
  });

  it("gives the jester a win when voted out", () => {
    let game = fixedGame(
      [
        player("p1", "mafia"),
        player("p2", "jester"),
        player("p3", "detective"),
        player("p4", "doctor"),
        player("p5", "villager")
      ],
      "voting"
    );

    game = submitVote(game, "p1", "p2").game;
    game = submitVote(game, "p3", "p2").game;
    game = submitVote(game, "p4", "p2").game;
    const result = resolveVote(game);

    expect(result.game.phase).toBe("gameOver");
    expect(result.game.winner).toBe("jester");
  });
});

describe("7-player smoke flow", () => {
  it("runs lobby, night, discussion, vote, and elimination", () => {
    let game = createGame({ id: "p1", name: "P1" });
    for (let index = 2; index <= 7; index += 1) {
      game = addPlayer(game, { id: `p${index}`, name: `P${index}` }).game;
      game = setReady(game, `p${index}`, true).game;
    }

    game = startGame(game, "p1", () => 0.1).game;
    game = beginNight(game).game;

    const mafia = game.players.find((candidate) => candidate.role === "mafia")!;
    const detective = game.players.find((candidate) => candidate.role === "detective")!;
    const doctor = game.players.find((candidate) => candidate.role === "doctor")!;
    const victim = game.players.find((candidate) => candidate.role === "villager")!;

    game = submitNightAction(game, { actorId: mafia.id, type: "mafiaKill", targetId: victim.id }).game;
    game = submitNightAction(game, { actorId: detective.id, type: "investigate", targetId: mafia.id }).game;
    game = submitNightAction(game, { actorId: doctor.id, type: "protect", targetId: detective.id }).game;
    game = resolveNight(game).game;
    expect(game.players.find((candidate) => candidate.id === victim.id)?.alive).toBe(false);

    game = beginDayDiscussion(game).game;
    game = beginVoting(game).game;
    for (const voter of game.players.filter((candidate) => candidate.alive).slice(0, 4)) {
      game = submitVote(game, voter.id, mafia.id).game;
    }
    game = resolveVote(game).game;

    expect(game.players.find((candidate) => candidate.id === mafia.id)?.alive).toBe(false);
    expect(["elimination", "gameOver"]).toContain(game.phase);
  });
});
