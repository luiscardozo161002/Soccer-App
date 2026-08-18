import type { PrismaClient } from "../../app/generated/prisma/client";
import { readJson } from "./read-json";
import type { PlayerSeed } from "./types";

export async function seedPlayers(prisma: PrismaClient, teamsByName: Map<string, string>) {
  const playersData = readJson<PlayerSeed[]>("players.json");
  const playersByRegistration = new Map<string, string>();
  for (const p of playersData) {
    const teamId = teamsByName.get(p.team);
    if (!teamId) throw new Error(`Unknown team "${p.team}" referenced in players.json`);

    const player = await prisma.player.create({
      data: {
        teamId,
        name: p.name,
        registrationNumber: p.registrationNumber,
        birthDate: p.birthDate ? new Date(p.birthDate) : undefined,
      },
    });
    playersByRegistration.set(p.registrationNumber, player.id);
  }
  return playersByRegistration;
}
