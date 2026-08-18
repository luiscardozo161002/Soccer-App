import type { PrismaClient } from "../../app/generated/prisma/client";
import { readJson } from "./read-json";
import type { SanctionSeed } from "./types";

export async function seedSanctions(prisma: PrismaClient, cardsByPlayerAndMatchday: Map<string, string>) {
  const sanctionsData = readJson<SanctionSeed[]>("sanctions.json");
  for (const s of sanctionsData) {
    const cardId = cardsByPlayerAndMatchday.get(`${s.player}|${s.cardMatchday}`);
    if (!cardId) {
      throw new Error(`Unknown card for player "${s.player}" at matchday ${s.cardMatchday}`);
    }

    await prisma.sanction.create({
      data: {
        cardId,
        matchdayStart: s.matchdayStart,
        matchdayEnd: s.matchdayEnd,
        matchesSuspended: s.matchesSuspended,
      },
    });
  }
  return sanctionsData.length;
}
