export type Role = "mafia" | "villager" | "detective" | "doctor";

export type Team = "mafia" | "town";

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

export type Winner = "town" | "mafia";

export type Player = {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
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
};

export type NightAction =
  | { actorId: string; type: "mafiaKill"; targetId: string }
  | { actorId: string; type: "investigate"; targetId: string }
  | { actorId: string; type: "protect"; targetId: string };

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

export type NightResolution = {
  killedPlayerId?: string;
  savedPlayerId?: string;
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
  events: GameEvent[];
  lastNightResolution?: NightResolution;
  winner?: Winner;
  self?: PlayerPrivateState;
};

export type RoleCount = {
  mafia: number;
  detective: number;
  doctor: number;
  villager: number;
};
