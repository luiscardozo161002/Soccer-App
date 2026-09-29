import type { PrismaClient } from "../../app/generated/prisma/client";

export interface SeasonSeed {
  name: string;
  adjustmentReason: string;
}

export const SEASON: SeasonSeed = {
  name: 'Torneo de Clausura "Caliope" 2026',
  adjustmentReason: 'Carga inicial (previo a Jornada 7) — Torneo de Clausura "Caliope" 2026',
};

export async function seedSeason(prisma: PrismaClient) {
  // Whatever season is currently active — regardless of its name — is the
  // one the league is actually running. Never archive/replace it just
  // because it doesn't literally match SEASON.name; that would silently
  // swap out real tournament data on any re-run against an environment
  // that already has its own active season.
  const activeSeason = await prisma.season.findFirst({ where: { status: "active" } });
  if (activeSeason) {
    return { season: activeSeason, created: false };
  }

  const existingByName = await prisma.season.findFirst({ where: { name: SEASON.name } });
  if (existingByName) {
    const season = await prisma.season.update({
      where: { id: existingByName.id },
      data: { status: "active", endDate: null },
    });
    return { season, created: false };
  }

  const season = await prisma.season.create({ data: { name: SEASON.name, status: "active" } });
  return { season, created: true };
}
