export enum GameState {
  LOBBY = 'LOBBY',
  ROLE_REVEAL = 'ROLE_REVEAL',
  NIGHT_PHASE = 'NIGHT_PHASE',
  NIGHT_RESOLUTION = 'NIGHT_RESOLUTION',
  DISCUSSION_PHASE = 'DISCUSSION_PHASE',
  VOTING_PHASE = 'VOTING_PHASE',
  ELIMINATION = 'ELIMINATION',
  WIN_CHECK = 'WIN_CHECK',
  END_GAME = 'END_GAME',
}

export interface PlayerAction {
  playerId: string;
  targetId: string;
  actionType: 'KILL' | 'SAVE' | 'INVESTIGATE' | 'VOTE';
}

export interface NightRoundResult {
  deathId: string | null;
  savedId: string | null;
  investigationResult?: { targetId: string; isMafia: boolean };
}

export enum Role {
  MAFIA = 'MAFIA',
  POLICE = 'POLICE',
  DOCTOR = 'DOCTOR',
  VILLAGER = 'VILLAGER',
}

export interface Player {
  id: string;
  name: string;
  role?: Role;
  isAlive: boolean;
  isHost: boolean;
  // Bot-specific metadata
  personality?: 'AGGRESSIVE' | 'DEFENSIVE' | 'ANALYTICAL' | 'QUIET';
  suspicionMap?: Record<string, number>; // playerId -> suspicion level (0-100)
}

export interface GameSettings {
  maxPlayers: number;
}

export class GameEngine {
  static calculateRoles(totalPlayers: number): Role[] {
    const mafiaCount = Math.floor(totalPlayers * 0.3) || 1;
    const roles: Role[] = [];

    for (let i = 0; i < mafiaCount; i++) roles.push(Role.MAFIA);
    roles.push(Role.POLICE);
    roles.push(Role.DOCTOR);

    const villagersCount = totalPlayers - roles.length;
    for (let i = 0; i < villagersCount; i++) roles.push(Role.VILLAGER);

    return this.shuffle(roles);
  }

  private static shuffle<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = newArray[i];
      newArray[i] = newArray[j];
      newArray[j] = temp;
    }
    return newArray;
  }

  static resolveNightPhase(actions: PlayerAction[]): NightRoundResult {
    const mafiaAction = actions.find((a) => a.actionType === 'KILL');
    const doctorAction = actions.find((a) => a.actionType === 'SAVE');
    const _policeAction = actions.find((a) => a.actionType === 'INVESTIGATE');
    const result: NightRoundResult = {
      deathId: null,
      savedId: doctorAction?.targetId ?? null,
    };

    if (mafiaAction) {
      if (mafiaAction.targetId !== result.savedId) {
        result.deathId = mafiaAction.targetId;
      }
    }

    return result;
  }

  static checkWinCondition(players: Player[]): { winner: 'MAFIA' | 'VILLAGERS' | null } {
    const alivePlayers = players.filter((p) => p.isAlive);
    const mafiaAlive = alivePlayers.filter((p) => p.role === Role.MAFIA).length;
    const nonMafiaAlive = alivePlayers.length - mafiaAlive;

    if (mafiaAlive === 0) {
      return { winner: 'VILLAGERS' };
    }

    if (mafiaAlive >= nonMafiaAlive) {
      return { winner: 'MAFIA' };
    }

    return { winner: null };
  }
}
