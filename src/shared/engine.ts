import { buildRoleDeck, getDetectiveRead, getTeam, isMafiaRole } from "./roles";
import type {
  ChatMessage,
  ClientGameState,
  Game,
  GameEvent,
  GameSettings,
  NightAction,
  NightResolution,
  Player,
  PublicPlayer,
  Role,
  Winner
} from "./types";

export const DEFAULT_SETTINGS: GameSettings = {
  minPlayers: 5,
  maxPlayers: 30,
  discussionSeconds: 180,
  votingSeconds: 60,
  votingMode: "majority",
  revealRolesOnDeath: true,
  classicRolesEnabled: true,
  botsEnabled: false,
  botOnly: false,
  botDifficulty: "normal"
};

export type EngineResult<T = Game> = {
  game: T;
  error?: string;
};

type IdFactory = () => string;

const defaultId: IdFactory = () => Math.random().toString(36).slice(2, 10);

function cloneGame(game: Game): Game {
  return {
    ...game,
    settings: { ...game.settings },
    players: game.players.map((player) => ({ ...player })),
    nightActions: game.nightActions.map((action) => ({ ...action })),
    votes: { ...game.votes },
    chat: game.chat.map((message) => ({ ...message })),
    events: game.events.map((event) => ({ ...event })),
    lastNightResolution: game.lastNightResolution
      ? {
          ...game.lastNightResolution,
          investigationResults: game.lastNightResolution.investigationResults.map((result) => ({ ...result }))
        }
      : undefined
  };
}

function makeEvent(message: string, scope: "public" | "private" = "public", playerId?: string): GameEvent {
  return {
    id: defaultId(),
    at: Date.now(),
    scope,
    playerId,
    message
  };
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function createGame(host: { id: string; name: string }, options: Partial<GameSettings> = {}): Game {
  const settings = { ...DEFAULT_SETTINGS, ...options };
  const hostPlayer: Player = {
    id: host.id,
    name: host.name.trim() || "Host",
    isHost: true,
    isReady: true,
    isConnected: true,
    isBot: false,
    alive: true,
    joinedAt: Date.now()
  };

  return {
    id: defaultId(),
    code: makeRoomCode(),
    phase: "lobby",
    settings,
    players: [hostPlayer],
    hostId: host.id,
    dayNumber: 0,
    nightNumber: 0,
    nightActions: [],
    votes: {},
    chat: [],
    events: [makeEvent(`${hostPlayer.name} created the room.`)]
  };
}

export function makeRoomCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export function addPlayer(game: Game, player: { id: string; name: string }): EngineResult {
  const next = cloneGame(game);
  const name = player.name.trim();

  if (next.phase !== "lobby") {
    return { game: next, error: "This game has already started." };
  }

  if (!name) {
    return { game: next, error: "Enter a player name." };
  }

  if (next.players.length >= next.settings.maxPlayers) {
    return { game: next, error: `This room is capped at ${next.settings.maxPlayers} players.` };
  }

  if (next.players.some((existing) => existing.id === player.id)) {
    return { game: next };
  }

  next.players.push({
    id: player.id,
    name,
    isHost: false,
    isReady: false,
    isConnected: true,
    isBot: false,
    alive: true,
    joinedAt: Date.now()
  });
  next.events.push(makeEvent(`${name} joined the room.`));
  return { game: next };
}

export function setReady(game: Game, playerId: string, isReady: boolean): EngineResult {
  const next = cloneGame(game);
  const player = next.players.find((candidate) => candidate.id === playerId);
  if (!player || next.phase !== "lobby") {
    return { game: next, error: "Ready state can only change in the lobby." };
  }

  player.isReady = player.isHost ? true : isReady;
  return { game: next };
}

export function setConnected(game: Game, playerId: string, isConnected: boolean): EngineResult {
  const next = cloneGame(game);
  const player = next.players.find((candidate) => candidate.id === playerId);
  if (player) {
    player.isConnected = isConnected;
    next.events.push(makeEvent(`${player.name} ${isConnected ? "reconnected" : "disconnected"}.`));
  }
  return { game: next };
}

export function addChatMessage(game: Game, playerId: string, text: string): EngineResult {
  const next = cloneGame(game);
  const player = next.players.find((candidate) => candidate.id === playerId);
  const clean = text.trim().replace(/\s+/g, " ").slice(0, 220);
  if (!player) {
    return { game: next, error: "Player not found." };
  }
  if (!clean) {
    return { game: next, error: "Message cannot be empty." };
  }
  if (!player.alive && next.phase !== "gameOver") {
    return { game: next, error: "Dead players can watch, but table chat is locked." };
  }

  const message: ChatMessage = {
    id: defaultId(),
    at: Date.now(),
    playerId: player.id,
    playerName: player.name,
    isBot: player.isBot,
    text: clean
  };
  next.chat.push(message);
  if (next.chat.length > 80) {
    next.chat = next.chat.slice(-80);
  }
  return { game: next };
}

export function updateSettings(game: Game, settings: Partial<GameSettings>): EngineResult {
  const next = cloneGame(game);
  if (next.phase !== "lobby") {
    return { game: next, error: "Room settings can only change in the lobby." };
  }

  next.settings = {
    ...next.settings,
    ...settings,
    maxPlayers: Math.max(next.settings.minPlayers, Math.min(30, settings.maxPlayers ?? next.settings.maxPlayers))
  };
  if (next.settings.botOnly) {
    next.settings.botsEnabled = true;
  }
  next.events.push(makeEvent("Room settings updated."));
  return { game: next };
}

export function leaveGame(game: Game, playerId: string): EngineResult {
  const next = cloneGame(game);
  const leaving = next.players.find((player) => player.id === playerId);
  if (!leaving) {
    return { game: next };
  }

  if (next.phase === "lobby") {
    next.players = next.players.filter((player) => player.id !== playerId);
    next.events.push(makeEvent(`${leaving.name} left the room.`));
    if (leaving.isHost && next.players.length > 0) {
      next.hostId = next.players[0].id;
      next.players = next.players.map((player, index) => ({ ...player, isHost: index === 0, isReady: index === 0 ? true : player.isReady }));
      next.events.push(makeEvent(`${next.players[0].name} is now host.`));
    }
    return { game: next };
  }

  return setConnected(next, playerId, false);
}

export function startGame(game: Game, hostId: string, random: () => number = Math.random): EngineResult {
  const next = cloneGame(game);

  if (next.phase !== "lobby") {
    return { game: next, error: "The game is already running." };
  }

  if (next.hostId !== hostId) {
    return { game: next, error: "Only the host can start the game." };
  }

  if (next.players.length < next.settings.minPlayers) {
    return { game: next, error: `At least ${next.settings.minPlayers} players are required.` };
  }

  if (!next.players.every((player) => player.isReady)) {
    return { game: next, error: "Every player must be ready before the game starts." };
  }

  next.players = assignRoles(next.players, random, next.settings.classicRolesEnabled);
  next.phase = "roleReveal";
  next.dayNumber = 0;
  next.nightNumber = 0;
  next.votes = {};
  next.nightActions = [];
  next.events.push(makeEvent("Roles have been dealt. Check your private role."));
  return { game: next };
}

export function resetToLobby(game: Game): EngineResult {
  const next = cloneGame(game);
  next.phase = "lobby";
  next.dayNumber = 0;
  next.nightNumber = 0;
  next.phaseEndsAt = undefined;
  next.nightActions = [];
  next.votes = {};
  next.chat = [];
  next.events = [makeEvent("The game has been reset to the lobby.")];
  next.lastNightResolution = undefined;
  next.winner = undefined;
  next.players = next.players.map((player) => ({
    ...player,
    alive: true,
    role: undefined,
    isReady: player.isHost || player.isBot
  }));
  return { game: next };
}

export function assignRoles(players: Player[], random: () => number = Math.random, classicRolesEnabled = true): Player[] {
  const deck = shuffle(buildRoleDeck(players.length, classicRolesEnabled), random);
  return players.map((player, index) => ({
    ...player,
    alive: true,
    role: deck[index]
  }));
}

export function addBot(game: Game, name?: string): EngineResult {
  const next = cloneGame(game);
  if (next.phase !== "lobby") {
    return { game: next, error: "Bots can only be added in the lobby." };
  }
  if (!next.settings.botsEnabled && !next.settings.botOnly) {
    return { game: next, error: "Enable bot play before adding bots." };
  }
  if (next.players.length >= next.settings.maxPlayers) {
    return { game: next, error: `This room is capped at ${next.settings.maxPlayers} players.` };
  }
  const botNumber = next.players.filter((player) => player.isBot).length + 1;
  const botName = name?.trim() || BOT_NAMES[(botNumber - 1) % BOT_NAMES.length];
  next.players.push({
    id: `bot-${defaultId()}`,
    name: botName,
    isHost: false,
    isReady: true,
    isConnected: true,
    isBot: true,
    alive: true,
    joinedAt: Date.now()
  });
  next.events.push(makeEvent(`${botName} joined as a bot.`));
  return { game: next };
}

export function removeBot(game: Game, botId: string): EngineResult {
  const next = cloneGame(game);
  if (next.phase !== "lobby") {
    return { game: next, error: "Bots can only be removed in the lobby." };
  }
  const bot = next.players.find((player) => player.id === botId && player.isBot);
  if (!bot) {
    return { game: next, error: "Bot not found." };
  }
  next.players = next.players.filter((player) => player.id !== botId);
  next.events.push(makeEvent(`${bot.name} left the table.`));
  return { game: next };
}

export function fillBotsToMinimum(game: Game): EngineResult {
  let result: EngineResult = { game };
  while (result.game.players.length < result.game.settings.minPlayers) {
    result = addBot(result.game);
    if (result.error) {
      return result;
    }
  }
  return result;
}

export function beginNight(game: Game): EngineResult {
  const next = cloneGame(game);
  if (!["roleReveal", "nightResolution", "elimination"].includes(next.phase)) {
    return { game: next, error: "Night cannot begin from this phase." };
  }

  next.phase = "night";
  next.nightNumber += 1;
  next.nightActions = [];
  next.votes = {};
  next.lastNightResolution = undefined;
  next.events.push(makeEvent(`Night ${next.nightNumber} begins.`));
  return { game: next };
}

export function beginDayDiscussion(game: Game): EngineResult {
  const next = cloneGame(game);
  if (next.phase !== "nightResolution") {
    return { game: next, error: "Day discussion must follow night resolution." };
  }

  next.phase = "dayDiscussion";
  next.dayNumber += 1;
  next.phaseEndsAt = Date.now() + next.settings.discussionSeconds * 1000;
  next.events.push(makeEvent(`Day ${next.dayNumber} discussion begins.`));
  return { game: next };
}

export function beginVoting(game: Game): EngineResult {
  const next = cloneGame(game);
  if (next.phase !== "dayDiscussion") {
    return { game: next, error: "Voting must follow day discussion." };
  }

  next.phase = "voting";
  next.votes = {};
  next.phaseEndsAt = Date.now() + next.settings.votingSeconds * 1000;
  next.events.push(makeEvent("Voting is open."));
  return { game: next };
}

export function submitNightAction(game: Game, action: NightAction): EngineResult {
  const next = cloneGame(game);
  if (next.phase !== "night") {
    return { game: next, error: "Night actions are only allowed during night." };
  }

  const actor = next.players.find((player) => player.id === action.actorId);
  const target = next.players.find((player) => player.id === action.targetId);

  if (!actor?.alive || !target?.alive || !actor.role) {
    return { game: next, error: "Only living players can target living players." };
  }

  const blockedActorIds = next.nightActions
    .filter((existing) => existing.type === "roleblock")
    .map((existing) => existing.targetId);
  if (blockedActorIds.includes(action.actorId)) {
    return { game: next, error: "That player is blocked tonight." };
  }

  const allowed =
    (action.type === "mafiaKill" && isMafiaRole(actor.role)) ||
    (action.type === "investigate" && actor.role === "detective") ||
    (action.type === "protect" && actor.role === "doctor") ||
    (action.type === "vigilanteKill" && actor.role === "vigilante") ||
    (action.type === "serialKill" && actor.role === "serialKiller") ||
    (action.type === "roleblock" && actor.role === "roleblocker");

  if (!allowed) {
    return { game: next, error: "That role cannot perform this action." };
  }

  next.nightActions = next.nightActions.filter((existing) => {
    if (action.type === "mafiaKill") {
      return existing.type !== "mafiaKill";
    }
    return !(existing.actorId === action.actorId && existing.type === action.type);
  });
  next.nightActions.push(action);
  next.events.push(makeEvent("Night action submitted.", "private", action.actorId));
  return { game: next };
}

export function resolveNight(game: Game): EngineResult {
  const next = cloneGame(game);
  if (next.phase !== "night") {
    return { game: next, error: "Night can only be resolved during night." };
  }

  const kill = next.nightActions.find((action) => action.type === "mafiaKill");
  const vigilanteKill = next.nightActions.find((action) => action.type === "vigilanteKill");
  const serialKill = next.nightActions.find((action) => action.type === "serialKill");
  const blocks = next.nightActions.filter((action) => action.type === "roleblock");
  const blockedPlayerIds = blocks.map((action) => action.targetId);
  const protects = next.nightActions.filter((action) => action.type === "protect");
  const investigations = next.nightActions.filter((action) => action.type === "investigate" && !blockedPlayerIds.includes(action.actorId));
  const saved = kill ? protects.find((action) => action.targetId === kill.targetId && !blockedPlayerIds.includes(action.actorId)) : undefined;
  const killedPlayerId = kill && !saved && !blockedPlayerIds.includes(kill.actorId) ? kill.targetId : undefined;
  const secondaryKilledPlayerId = [vigilanteKill, serialKill]
    .filter((action): action is NonNullable<typeof action> => Boolean(action && !blockedPlayerIds.includes(action.actorId)))
    .map((action) => action.targetId)
    .find((targetId) => targetId !== killedPlayerId && !protects.some((protect) => protect.targetId === targetId));

  if (killedPlayerId) {
    const killed = next.players.find((player) => player.id === killedPlayerId);
    if (killed) {
      killed.alive = false;
      next.events.push(makeEvent(`${killed.name} was found eliminated at dawn.`));
    }
  } else {
    next.events.push(makeEvent("No one was eliminated during the night."));
  }

  if (secondaryKilledPlayerId) {
    const killed = next.players.find((player) => player.id === secondaryKilledPlayerId);
    if (killed) {
      killed.alive = false;
      next.events.push(makeEvent(`${killed.name} was also eliminated before sunrise.`));
    }
  }

  const investigationResults = investigations
    .map((action) => {
      const target = next.players.find((player) => player.id === action.targetId);
      if (!target?.role) {
        return undefined;
      }
      return {
        actorId: action.actorId,
        targetId: action.targetId,
        result: getDetectiveRead(target.role),
        night: next.nightNumber
      };
    })
    .filter((result): result is NonNullable<typeof result> => Boolean(result));

  for (const result of investigationResults) {
    const target = next.players.find((player) => player.id === result.targetId);
    next.events.push(makeEvent(`${target?.name ?? "Target"} reads as ${result.result}.`, "private", result.actorId));
  }

  const resolution: NightResolution = {
    killedPlayerId,
    secondaryKilledPlayerId,
    savedPlayerId: saved?.targetId,
    blockedPlayerIds,
    investigationResults
  };
  next.phase = "nightResolution";
  next.lastNightResolution = resolution;
  next.nightActions = [];

  const winner = checkWinCondition(next);
  if (winner) {
    next.phase = "gameOver";
    next.winner = winner;
    next.events.push(makeEvent(`${winner === "town" ? "Town" : "Mafia"} wins.`));
  }

  return { game: next };
}

export function submitVote(game: Game, voterId: string, targetId: string): EngineResult {
  const next = cloneGame(game);
  if (next.phase !== "voting") {
    return { game: next, error: "Votes are only allowed during voting." };
  }

  const voter = next.players.find((player) => player.id === voterId);
  const target = next.players.find((player) => player.id === targetId);
  if (!voter?.alive || !target?.alive) {
    return { game: next, error: "Only living players can vote for living players." };
  }

  next.votes[voterId] = targetId;
  next.events.push(makeEvent(`${voter.name} cast a vote.`));
  return { game: next };
}

export function resolveVote(game: Game): EngineResult & { eliminatedPlayerId?: string } {
  const next = cloneGame(game);
  if (next.phase !== "voting") {
    return { game: next, error: "Votes can only resolve during voting." };
  }

  const livingPlayers = next.players.filter((player) => player.alive);
  const counts = new Map<string, number>();
  for (const [voterId, targetId] of Object.entries(next.votes)) {
    if (livingPlayers.some((player) => player.id === targetId)) {
      const voter = next.players.find((player) => player.id === voterId);
      const voteWeight = voter?.role === "mayor" ? 2 : 1;
      counts.set(targetId, (counts.get(targetId) ?? 0) + voteWeight);
    }
  }

  let eliminatedPlayerId: string | undefined;
  let highVote = 0;
  let tied = false;

  for (const [targetId, count] of counts) {
    if (count > highVote) {
      highVote = count;
      eliminatedPlayerId = targetId;
      tied = false;
    } else if (count === highVote) {
      tied = true;
    }
  }

  const needsMajority = Math.floor(livingPlayers.length / 2) + 1;
  if (next.settings.votingMode === "majority" && highVote < needsMajority) {
    eliminatedPlayerId = undefined;
  }
  if (tied) {
    eliminatedPlayerId = undefined;
  }

  if (eliminatedPlayerId) {
    const eliminated = next.players.find((player) => player.id === eliminatedPlayerId);
    if (eliminated) {
      eliminated.alive = false;
      const roleText = next.settings.revealRolesOnDeath && eliminated.role ? ` They were ${eliminated.role}.` : "";
      next.events.push(makeEvent(`${eliminated.name} was voted out.${roleText}`));
      if (eliminated.role === "jester") {
        next.phase = "gameOver";
        next.winner = "jester";
        next.events.push(makeEvent("The Jester wins by getting voted out."));
        return { game: next, eliminatedPlayerId };
      }
    }
  } else {
    next.events.push(makeEvent("The vote failed to eliminate anyone."));
  }

  next.phase = "elimination";
  next.phaseEndsAt = undefined;
  const winner = checkWinCondition(next);
  if (winner) {
    next.phase = "gameOver";
    next.winner = winner;
    next.events.push(makeEvent(`${winner === "town" ? "Town" : "Mafia"} wins.`));
  }

  return { game: next, eliminatedPlayerId };
}

export function checkWinCondition(game: Game): Winner | undefined {
  const living = game.players.filter((player) => player.alive && player.role);
  const mafia = living.filter((player) => player.role && getTeam(player.role) === "mafia").length;
  const serialKillers = living.filter((player) => player.role === "serialKiller").length;
  const town = living.filter((player) => player.role && getTeam(player.role) === "town").length;
  const nonMafia = living.length - mafia;

  if (serialKillers > 0 && living.length <= serialKillers + 1 && mafia === 0) {
    return "serialKiller";
  }

  if (mafia === 0 && serialKillers === 0 && town > 0) {
    return "town";
  }

  if (mafia >= nonMafia && mafia > 0) {
    return "mafia";
  }

  return undefined;
}

export function toPublicPlayer(player: Player, revealRole = false): PublicPlayer {
  return {
    id: player.id,
    name: player.name,
    isHost: player.isHost,
    isReady: player.isReady,
    isConnected: player.isConnected,
    isBot: player.isBot,
    alive: player.alive,
    role: revealRole ? player.role : undefined
  };
}

export function toClientState(game: Game, viewerId?: string): ClientGameState {
  const viewer = game.players.find((player) => player.id === viewerId);
  const gameEnded = game.phase === "gameOver";
  const publicEvents = game.events.filter((event) => event.scope === "public" || event.playerId === viewerId);
  const mafiaTeam = isMafiaRole(viewer?.role) || gameEnded
    ? game.players.filter((player) => isMafiaRole(player.role)).map((player) => toPublicPlayer(player, true))
    : [];

  return {
    id: game.id,
    code: game.code,
    phase: game.phase,
    settings: { ...game.settings },
    players: game.players.map((player) => toPublicPlayer(player, gameEnded)),
    dayNumber: game.dayNumber,
    nightNumber: game.nightNumber,
    phaseEndsAt: game.phaseEndsAt,
    votes: { ...game.votes },
    chat: game.chat,
    events: publicEvents,
    lastNightResolution: game.lastNightResolution
      ? {
          ...game.lastNightResolution,
          investigationResults: game.lastNightResolution.investigationResults.filter((result) => result.actorId === viewerId || gameEnded)
        }
      : undefined,
    winner: game.winner,
    self: viewer
      ? {
          playerId: viewer.id,
          role: viewer.role,
          mafiaTeam,
          investigationResults: collectInvestigationResults(game, viewer.id),
          canAct: Boolean(viewer.alive && game.phase !== "gameOver")
        }
      : undefined
  };
}

function collectInvestigationResults(game: Game, playerId: string) {
  const fromResolution = game.lastNightResolution?.investigationResults ?? [];
  const fromEvents = fromResolution.filter((result) => result.actorId === playerId);
  return fromEvents;
}

const BOT_NAMES = [
  "Nico",
  "Mira",
  "Sal",
  "Iris",
  "Theo",
  "Rafa",
  "June",
  "Omar",
  "Lena",
  "Vik"
];
