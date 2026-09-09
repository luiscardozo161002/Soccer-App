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
  const existing = await prisma.season.findFirst({ where: { name: SEASON.name } });
  if (existing) {
    return { season: existing, created: false };
  }

  await prisma.season.updateMany({
    where: { status: "active" },
    data: { status: "archived", endDate: new Date() },
  });
  const season = await prisma.season.create({ data: { name: SEASON.name, status: "active" } });
  return { season, created: true };
}
