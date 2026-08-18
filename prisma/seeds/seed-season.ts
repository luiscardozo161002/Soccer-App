import type { PrismaClient } from "../../app/generated/prisma/client";

export function seedSeason(prisma: PrismaClient) {
  return prisma.season.create({ data: { name: `Liga ${new Date().getFullYear()}` } });
}
