import type { PrismaClient } from "../../app/generated/prisma/client";
import { readJson } from "./read-json";
import type { TeamSeed } from "./types";

export async function seedTeams(prisma: PrismaClient) {
  const teamsData = readJson<TeamSeed[]>("teams.json");
  const teamsByName = new Map<string, string>();
  for (const t of teamsData) {
    const team = await prisma.team.create({ data: t });
    teamsByName.set(t.name, team.id);
  }
  return teamsByName;
}
