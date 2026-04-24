export type Role =
  | "mafia"
  | "godfather"
  | "roleblocker"
  | "villager"
  | "detective"
  | "doctor"
  | "vigilante"
  | "mayor"
  | "jester"
  | "serialKiller";

export type Team = "mafia" | "town" | "neutral";

export type Phase =
  | "lobby"
  | "roleReveal"
  | "night"
  | "nightResolution"
  | "dayDiscussion"
  | "voting"
  | "elimination"
  | "gameOver";

export type VotingMode = "majority" | "plurality";

export type Winner = "town" | "mafia" | "jester" | "serialKiller";

export type BotDifficulty = "easy" | "normal" | "hard" | "impossible";

export type Player = {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  isBot: boolean;
  alive: boolean;
  role?: Role;
  joinedAt: number;
};

export type GameSettings = {
  minPlayers: number;
  maxPlayers: number;
  discussionSeconds: number;
  votingSeconds: number;
  votingMode: VotingMode;
  revealRolesOnDeath: boolean;
  classicRolesEnabled: boolean;
  botsEnabled: boolean;
  botOnly: boolean;
  botDifficulty: BotDifficulty;
};

export type NightAction =
  | { actorId: string; type: "mafiaKill"; targetId: string }
  | { actorId: string; type: "investigate"; targetId: string }
  | { actorId: string; type: "protect"; targetId: string }
  | { actorId: string; type: "vigilanteKill"; targetId: string }
  | { actorId: string; type: "serialKill"; targetId: string }
  | { actorId: string; type: "roleblock"; targetId: string };

export type InvestigationResult = {
  actorId: string;
  targetId: string;
  result: Team;
  night: number;
};

export type GameEvent = {
  id: string;
  at: number;
  scope: "public" | "private";
  message: string;
  playerId?: string;
};

export type ChatMessage = {
  id: string;
  at: number;
  playerId: string;
  playerName: string;
  isBot: boolean;
  text: string;
};

export type NightResolution = {
  killedPlayerId?: string;
  secondaryKilledPlayerId?: string;
  savedPlayerId?: string;
  blockedPlayerIds: string[];
  investigationResults: InvestigationResult[];
};

export type Game = {
  id: string;
  code: string;
  phase: Phase;
  settings: GameSettings;
  players: Player[];
  hostId: string;
  dayNumber: number;
  nightNumber: number;
  phaseEndsAt?: number;
  nightActions: NightAction[];
  votes: Record<string, string>;
  chat: ChatMessage[];
  events: GameEvent[];
  lastNightResolution?: NightResolution;
  winner?: Winner;
};

export type PublicPlayer = {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  isBot: boolean;
  alive: boolean;
  role?: Role;
};

export type PlayerPrivateState = {
  playerId: string;
  role?: Role;
  mafiaTeam: PublicPlayer[];
  investigationResults: InvestigationResult[];
  canAct: boolean;
};

export type ClientGameState = {
  id: string;
  code: string;
  phase: Phase;
  settings: GameSettings;
  players: PublicPlayer[];
  dayNumber: number;
  nightNumber: number;
  phaseEndsAt?: number;
  votes: Record<string, string>;
  chat: ChatMessage[];
  events: GameEvent[];
  lastNightResolution?: NightResolution;
  winner?: Winner;
  self?: PlayerPrivateState;
};

export type RoleCount = {
  [role in Role]: number;
};
