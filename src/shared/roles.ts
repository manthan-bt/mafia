import type { Role, RoleCount } from "./types";

export type RoleRule = {
  min: number;
  max: number;
  mafia: number;
  detective: number;
  doctor: number;
};

export const ROLE_RULES: RoleRule[] = [
  { min: 5, max: 6, mafia: 1, detective: 1, doctor: 0 },
  { min: 7, max: 9, mafia: 2, detective: 1, doctor: 1 },
  { min: 10, max: 13, mafia: 3, detective: 1, doctor: 1 },
  { min: 14, max: 18, mafia: 4, detective: 1, doctor: 1 },
  { min: 19, max: 24, mafia: 5, detective: 1, doctor: 1 },
  { min: 25, max: 30, mafia: 6, detective: 1, doctor: 1 }
];

export function getRoleCount(playerCount: number): RoleCount {
  const rule = ROLE_RULES.find((candidate) => playerCount >= candidate.min && playerCount <= candidate.max);

  if (!rule) {
    throw new Error("Mafia supports 5 to 30 players in the current role table.");
  }

  const assigned = rule.mafia + rule.detective + rule.doctor;
  return {
    mafia: rule.mafia,
    detective: rule.detective,
    doctor: rule.doctor,
    villager: playerCount - assigned
  };
}

export function buildRoleDeck(playerCount: number): Role[] {
  const count = getRoleCount(playerCount);
  return [
    ...Array<Role>(count.mafia).fill("mafia"),
    ...Array<Role>(count.detective).fill("detective"),
    ...Array<Role>(count.doctor).fill("doctor"),
    ...Array<Role>(count.villager).fill("villager")
  ];
}

export function getTeam(role: Role): "mafia" | "town" {
  return role === "mafia" ? "mafia" : "town";
}
