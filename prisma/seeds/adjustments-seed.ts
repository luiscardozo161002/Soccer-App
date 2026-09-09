import type { PrismaClient, Season } from "../../app/generated/prisma/client";
import { TEAMS } from "./teams-seeds";
import { SEASON } from "./season-seed";

export async function seedAdjustments(prisma: PrismaClient, season: Season, teamIdByName: Map<string, string>) {
  let created = 0;
  let skipped = 0;

  for (const t of TEAMS) {
    const teamId = teamIdByName.get(t.name)!;
    const existing = await prisma.pointAdjustment.findFirst({
      where: { seasonId: season.id, teamId, reason: SEASON.adjustmentReason },
    });
    if (existing) {
      skipped++;
      continue;
    }

    await prisma.pointAdjustment.create({
      data: {
        seasonId: season.id,
        teamId,
        playedDelta: t.played,
        wonDelta: t.won,
        drawnDelta: t.drawn,
        lostDelta: t.lost,
        goalsForDelta: t.goalsFor,
        goalsAgainstDelta: t.goalsAgainst,
        reason: SEASON.adjustmentReason,
      },
    });
    created++;
  }

  return { created, skipped };
}
