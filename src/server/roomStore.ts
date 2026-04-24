import {
  addPlayer,
  addBot,
  addChatMessage,
  beginDayDiscussion,
  beginNight,
  beginVoting,
  createGame,
  fillBotsToMinimum,
  leaveGame,
  removeBot,
  resolveNight,
  resolveVote,
  resetToLobby,
  setConnected,
  setReady,
  startGame,
  submitNightAction,
  submitVote,
  updateSettings
} from "../shared/engine";
import { getTeam, isMafiaRole } from "../shared/roles";
import type { BotDifficulty, Game, GameSettings, NightAction, Player } from "../shared/types";

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
    if (game.settings.botOnly || game.settings.botsEnabled) {
      const filled = fillBotsToMinimum(game);
      game = filled.game;
      this.rooms.set(game.code, game);
    }
    return game;
  }

  listRooms() {
    return Array.from(this.rooms.values()).map((game) => ({
      code: game.code,
      phase: game.phase,
      playerCount: game.players.length,
      maxPlayers: game.settings.maxPlayers,
      isBotOnly: game.settings.botOnly
    }));
  }

  cleanup() {
    const now = Date.now();
    for (const [code, game] of this.rooms) {
      const humans = game.players.filter(p => !p.isBot);
      const everyoneAway = humans.length > 0 && humans.every(p => !p.isConnected);
      const empty = humans.length === 0;
      
      if (empty || everyoneAway) {
        // Only delete if it's been empty/away for a while (e.g. 10 mins)
        // For simplicity, we'll just check if the last person joined long ago
        const lastAction = game.events.length > 0 ? game.events[game.events.length - 1].at : 0;
        if (now - lastAction > 600000) { // 10 minutes
           this.rooms.delete(code);
        }
      }
    }
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

  updateSettings(code: string, requesterId: string, settings: Partial<GameSettings>): RoomMutationResult {
    const game = this.getRoom(code);
    if (!game) {
      return { error: "Room not found." };
    }
    if (game.hostId !== requesterId) {
      return { game, error: "Only the host can change room settings." };
    }
    return this.update(code, (current) => updateSettings(current, settings));
  }

  addBot(code: string, requesterId: string): RoomMutationResult {
    const game = this.getRoom(code);
    if (!game) {
      return { error: "Room not found." };
    }
    if (game.hostId !== requesterId) {
      return { game, error: "Only the host can add bots." };
    }
    return this.update(code, addBot);
  }

  removeBot(code: string, requesterId: string, botId: string): RoomMutationResult {
    const game = this.getRoom(code);
    if (!game) {
      return { error: "Room not found." };
    }
    if (game.hostId !== requesterId) {
      return { game, error: "Only the host can remove bots." };
    }
    return this.update(code, (current) => removeBot(current, botId));
  }

  fillBots(code: string, requesterId: string): RoomMutationResult {
    const game = this.getRoom(code);
    if (!game) {
      return { error: "Room not found." };
    }
    if (game.hostId !== requesterId) {
      return { game, error: "Only the host can fill bot seats." };
    }
    return this.update(code, fillBotsToMinimum);
  }

  startGame(code: string, hostId: string): RoomMutationResult {
    return this.update(code, (game) => startGame(game, hostId));
  }
  
  resetGame(code: string, hostId: string): RoomMutationResult {
    const game = this.getRoom(code);
    if (!game) return { error: "Room not found." };
    if (game.hostId !== hostId) return { game, error: "Only the host can reset the game." };
    return this.update(code, resetToLobby);
  }

  submitNightAction(code: string, action: NightAction): RoomMutationResult {
    return this.update(code, (game) => submitNightAction(game, action));
  }

  submitVote(code: string, voterId: string, targetId: string): RoomMutationResult {
    return this.update(code, (game) => submitVote(game, voterId, targetId));
  }

  addChat(code: string, playerId: string, text: string): RoomMutationResult {
    return this.update(code, (game) => addChatMessage(game, playerId, text));
  }

  chooseBotChatReply(code: string, humanMessage: string, humanId: string): { botId: string; text: string; delayMs: number } | undefined {
    const game = this.getRoom(code);
    if (!game || !game.settings.botsEnabled || game.phase === "night") {
      return undefined;
    }
    const bots = game.players.filter((player) => player.isBot && player.alive);
    if (bots.length === 0) {
      return undefined;
    }
    const bot = pickBotSpeaker(game, bots, humanMessage);
    const text = buildBotReply(game, bot, humanMessage, humanId);
    return {
      botId: bot.id,
      text,
      delayMs: botDelay(game.settings.botDifficulty, humanMessage)
    };
  }

  disconnect(code: string, playerId: string): RoomMutationResult {
    return this.update(code, (game) => setConnected(game, playerId, false));
  }

  leave(code: string, playerId: string): RoomMutationResult {
    return this.update(code, (game) => leaveGame(game, playerId));
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
      return this.update(code, (current) => resolveNight(applyBotNightActions(current)));
    }
    if (game.phase === "nightResolution") {
      return this.update(code, beginDayDiscussion);
    }
    if (game.phase === "dayDiscussion") {
      return this.update(code, beginVoting);
    }
    if (game.phase === "voting") {
      return this.update(code, (current) => resolveVote(applyBotVotes(current)));
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

function applyBotNightActions(game: Game): Game {
  let next = game;
  const living = next.players.filter((player) => player.alive);
  const botPlayers = living.filter((player) => player.isBot);

  for (const bot of botPlayers) {
    if (!bot.role) continue;
    const action = chooseBotNightAction(next, bot.id, next.nightActions.some((existing) => existing.type === "mafiaKill"));
    if (!action) continue;
    const result = submitNightAction(next, action);
    next = result.game;
  }
  return next;
}

function chooseBotNightAction(game: Game, botId: string, mafiaKillAlreadyChosen: boolean): NightAction | undefined {
  const bot = game.players.find((player) => player.id === botId);
  if (!bot?.role) return undefined;

  const living = game.players.filter((player) => player.alive && player.id !== bot.id);
  const nonMafiaTargets = shuffleArray(living.filter((player) => !isMafiaRole(player.role)));
  const suspectedTarget = chooseByDifficulty(game, bot, living);
  const anyTarget = suspectedTarget ?? shuffleArray(living)[0];

  if (isMafiaRole(bot.role) && !mafiaKillAlreadyChosen) {
    const target = chooseByDifficulty(game, bot, nonMafiaTargets);
    return target ? { actorId: bot.id, type: "mafiaKill", targetId: target.id } : undefined;
  }
  if (bot.role === "detective") {
    const target = anyTarget;
    return target ? { actorId: bot.id, type: "investigate", targetId: target.id } : undefined;
  }
  if (bot.role === "doctor") {
    const target = Math.random() > 0.5 ? bot : (anyTarget ?? bot);
    return { actorId: bot.id, type: "protect", targetId: target.id };
  }
  if (bot.role === "vigilante") {
    const target = suspectedTarget;
    return target ? { actorId: bot.id, type: "vigilanteKill", targetId: target.id } : undefined;
  }
  if (bot.role === "serialKiller") {
    const target = anyTarget;
    return target ? { actorId: bot.id, type: "serialKill", targetId: target.id } : undefined;
  }
  if (bot.role === "roleblocker") {
    const target = nonMafiaTargets[0] ?? anyTarget;
    return target ? { actorId: bot.id, type: "roleblock", targetId: target.id } : undefined;
  }
  return undefined;
}

function applyBotVotes(game: Game): Game {
  let next = game;
  for (const bot of next.players.filter((player) => player.isBot && player.alive)) {
    if (next.votes[bot.id]) continue;
    const target = chooseBotVoteTarget(next, bot.id);
    if (!target) continue;
    next = submitVote(next, bot.id, target.id).game;
  }
  return next;
}

function chooseBotVoteTarget(game: Game, botId: string) {
  const bot = game.players.find((player) => player.id === botId);
  const living = shuffleArray(game.players.filter((player) => player.alive && player.id !== botId));
  if (!bot?.role) return living[0];
  if (isMafiaRole(bot.role)) {
    return living.find((player) => !isMafiaRole(player.role)) ?? living[0];
  }
  return chooseByDifficulty(game, bot, living) ?? living[0];
}

function chooseByDifficulty(game: Game, bot: Player, candidates: Player[]) {
  if (candidates.length === 0) return undefined;
  
  let pool = [...candidates];
  const isEasy = game.settings.botDifficulty === "easy";
  const isDayOne = game.dayNumber <= 1;

  // On easy, 95% chance to prioritize other bots over humans
  // Mercy rule: 100% avoid humans on Day 1 Easy
  if (isEasy) {
    const botsOnly = pool.filter((p) => p.isBot);
    const avoidChance = isDayOne ? 1.0 : 0.95;
    if (botsOnly.length > 0 && Math.random() < avoidChance) {
      pool = botsOnly;
    }
  }

  const shuffled = shuffleArray(pool);
  
  if (game.settings.botDifficulty === "easy") {
    return shuffled[0];
  }

  const scores = shuffled.map((candidate) => ({
    player: candidate,
    score: publicSuspicion(game, candidate.id, bot.id)
  }));
  
  scores.sort((a, b) => b.score - a.score);
  
  const threshold = game.settings.botDifficulty === "normal" ? 2 : game.settings.botDifficulty === "hard" ? 1 : 0;
  
  if (scores[0].score >= threshold) {
    return scores[0].player;
  }
  
  return shuffled[0];
}

function publicSuspicion(game: Game, candidateId: string, botId: string) {
  let score = 0;
  const votes = game.votes ?? {};
  for (const targetId of Object.values(votes)) {
    if (targetId === candidateId) score += 1;
  }
  
  const chatLimit = game.settings.botDifficulty === "impossible" ? 30 : 15;
  const chat = game.chat ?? [];
  for (const message of chat.slice(-chatLimit)) {
    const lower = message.text.toLowerCase();
    const candidate = game.players.find((player) => player.id === candidateId);
    if (!candidate) continue;
    if (lower.includes(candidate.name.toLowerCase()) && /sus|mafia|vote|lying|fake|bluff|killer/.test(lower)) {
      score += message.playerId === botId ? 0 : 1;
    }
  }
  return score;
}

function shuffleArray<T>(array: T[]): T[] {
  const next = [...array];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function pickBotSpeaker(game: Game, bots: Player[], humanMessage: string) {
  const lower = humanMessage.toLowerCase();
  const mentioned = bots.find((bot) => lower.includes(bot.name.toLowerCase()));
  const chat = game.chat ?? [];
  return mentioned ?? bots[chat.length % bots.length];
}

function buildBotReply(game: Game, bot: Player, humanMessage: string, humanId: string) {
  const lower = humanMessage.toLowerCase();
  const human = game.players.find((player) => player.id === humanId);
  const asksRole = /are you|what are you|role|detective|doctor|mafia|jester|serial|godfather/.test(lower);
  const accused = /mafia|sus|lying|fake|bluff|killer/.test(lower);
  const difficulty = game.settings.botDifficulty;
  const claim = botClaim(bot, difficulty, accused || asksRole);

  if (asksRole && lower.includes(bot.name.toLowerCase())) {
    return claim;
  }
  if (accused && lower.includes(bot.name.toLowerCase())) {
    return isMafiaRole(bot.role)
      ? "No, that is too easy. I am town. Check my votes."
      : `No. I am ${claim.replace("I am ", "").replace(".", "")}. Watch the quiet players.`;
  }
  if (/who|vote|sus/.test(lower)) {
    const target = chooseBotVoteTarget(game, bot.id);
    return target ? `${target.name} feels off to me. I want pressure there.` : "I need one more message before I vote.";
  }
  if (human && difficulty !== "easy" && game.phase === "dayDiscussion") {
    return `${human.name}, say your role clearly. Short answers are suspicious right now.`;
  }
  
  const chat = game.chat ?? [];
  return ["I am watching vote movement.", "That claim needs a reason.", "Do not rush the vote.", claim][chat.length % 4];
}

function botClaim(bot: Player, difficulty: BotDifficulty, underPressure: boolean) {
  if (!bot.role) return "I am town.";
  if (isMafiaRole(bot.role)) {
    if (difficulty === "easy" && underPressure) return "I am not Mafia.";
    if (difficulty === "impossible") return "I am Detective. I will reveal my check after one more claim.";
    return "I am Villager. I have no night action.";
  }
  if (bot.role === "serialKiller") return difficulty === "easy" ? "I am neutral." : "I am Doctor. Do not waste a vote here.";
  if (bot.role === "jester") return underPressure ? "Vote me if you want, I am not worried." : "I am Villager.";
  if (bot.role === "detective") return "I am Detective.";
  if (bot.role === "doctor") return "I am Doctor.";
  if (bot.role === "vigilante") return "I am Villager with a reason to be careful.";
  return `I am ${bot.role === "mayor" ? "Mayor" : "Villager"}.`;
}

function botDelay(difficulty: BotDifficulty, text: string) {
  const base = difficulty === "easy" ? 2400 : difficulty === "normal" ? 1800 : difficulty === "hard" ? 1300 : 900;
  return base + Math.min(2600, text.length * 28);
}
