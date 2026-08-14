import { prisma } from "@/lib/prisma";
import { seasonRepository } from "@/lib/repositories/season.repository";
import { seasonService } from "@/lib/services/season.service";

async function nextSeasonName() {
  const year = new Date().getFullYear();
  const baseName = `Liga ${year}`;
  let name = baseName;
  let attempt = 2;
  while (await seasonRepository.nameExists(name)) {
    name = `${baseName} (${attempt})`;
    attempt++;
  }
  return name;
}

export const tournamentService = {
  async reset() {
    const active = await seasonService.getActive();
    const name = await nextSeasonName();

    const [, newSeason] = await prisma.$transaction([
      prisma.season.update({
        where: { id: active.id },
        data: { status: "archived", endDate: new Date() },
      }),
      prisma.season.create({ data: { name } }),
    ]);

    return newSeason;
  },
};
