import type { Role, RoleCount, Team } from "./types";

export type RoleRule = {
  min: number;
  max: number;
  roles: Partial<RoleCount>;
};

export const ROLE_RULES: RoleRule[] = [
  { min: 5, max: 6, roles: { mafia: 1, detective: 1 } },
  { min: 7, max: 9, roles: { mafia: 2, detective: 1, doctor: 1 } },
  { min: 10, max: 13, roles: { mafia: 2, godfather: 1, detective: 1, doctor: 1, vigilante: 1 } },
  {
    min: 14,
    max: 18,
    roles: { mafia: 3, godfather: 1, roleblocker: 1, detective: 1, doctor: 1, vigilante: 1, mayor: 1 }
  },
  {
    min: 19,
    max: 24,
    roles: { mafia: 4, godfather: 1, roleblocker: 1, detective: 1, doctor: 1, vigilante: 1, mayor: 1, jester: 1 }
  },
  {
    min: 25,
    max: 30,
    roles: {
      mafia: 5,
      godfather: 1,
      roleblocker: 1,
      detective: 1,
      doctor: 1,
      vigilante: 1,
      mayor: 1,
      jester: 1,
      serialKiller: 1
    }
  }
];

export const ALL_ROLES: Role[] = [
  "mafia",
  "godfather",
  "roleblocker",
  "villager",
  "detective",
  "doctor",
  "vigilante",
  "mayor",
  "jester",
  "serialKiller"
];

export function emptyRoleCount(): RoleCount {
  return {
    mafia: 0,
    godfather: 0,
    roleblocker: 0,
    villager: 0,
    detective: 0,
    doctor: 0,
    vigilante: 0,
    mayor: 0,
    jester: 0,
    serialKiller: 0
  };
}

export function getRoleCount(playerCount: number, classicRolesEnabled = true): RoleCount {
  const rule = ROLE_RULES.find((candidate) => playerCount >= candidate.min && playerCount <= candidate.max);

  if (!rule) {
    throw new Error("Mafia supports 5 to 30 players in the current role table.");
  }

  const count = emptyRoleCount();
  const baseRoles = classicRolesEnabled
    ? rule.roles
    : {
        mafia: mafiaCountFor(playerCount),
        detective: 1,
        doctor: playerCount >= 7 ? 1 : 0
      };

  for (const role of ALL_ROLES) {
    count[role] = baseRoles[role] ?? 0;
  }

  const assigned = ALL_ROLES.reduce((total, role) => total + count[role], 0);
  count.villager = playerCount - assigned;
  return count;
}

export function buildRoleDeck(playerCount: number, classicRolesEnabled = true): Role[] {
  const count = getRoleCount(playerCount, classicRolesEnabled);
  return ALL_ROLES.flatMap((role) => Array<Role>(count[role]).fill(role));
}

export function getTeam(role: Role): Team {
  if (role === "mafia" || role === "godfather" || role === "roleblocker") {
    return "mafia";
  }
  if (role === "jester" || role === "serialKiller") {
    return "neutral";
  }
  return "town";
}

export function getDetectiveRead(role: Role): Team {
  if (role === "godfather") {
    return "town";
  }
  return getTeam(role);
}

export function isMafiaRole(role?: Role): boolean {
  return Boolean(role && getTeam(role) === "mafia");
}

function mafiaCountFor(playerCount: number) {
  if (playerCount <= 6) return 1;
  if (playerCount <= 9) return 2;
  if (playerCount <= 13) return 3;
  if (playerCount <= 18) return 4;
  if (playerCount <= 24) return 5;
  return 6;
}
