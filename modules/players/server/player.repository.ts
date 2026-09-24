import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import type { LeagueCategoryValue } from "@/lib/constants/league-categories";

export interface PlayerWriteData {
  teamId?: string;
  name?: string;
  birthDate?: Date;
  registrationNumber?: string;
  registeredAt?: Date;
  photo?: Uint8Array<ArrayBuffer> | null;
  photoType?: string | null;
  photoUpdatedAt?: Date;
}

function playerWhere(teamId?: string, category?: LeagueCategoryValue) {
  if (!teamId && !category) return undefined;
  return {
    ...(teamId ? { teamId } : {}),
    ...(category ? { team: { category } } : {}),
  } satisfies Prisma.PlayerWhereInput;
}

export const playerRepository = {
  findMany({
    page,
    pageSize,
    teamId,
    category,
  }: {
    page: number;
    pageSize: number;
    teamId?: string;
    category?: LeagueCategoryValue;
  }) {
    return prisma.player.findMany({
      where: playerWhere(teamId, category),
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
      omit: { photo: true },
    });
  },

  count(teamId?: string, category?: LeagueCategoryValue) {
    return prisma.player.count({ where: playerWhere(teamId, category) });
  },

  findById(id: string) {
    return prisma.player.findUnique({ where: { id }, omit: { photo: true } });
  },

  findByRegistrationNumber(registrationNumber: string) {
    return prisma.player.findUnique({ where: { registrationNumber } });
  },

  async findByNameInsensitive(name: string) {
    const players = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM players WHERE lower(btrim(name)) = lower(btrim(${name})) LIMIT 1
    `;
    return players[0] ?? null;
  },

  findPhoto(id: string) {
    return prisma.player.findUnique({ where: { id }, select: { photo: true, photoType: true } });
  },

  create(
    data: PlayerWriteData & {
      teamId: string;
      name: string;
      registrationNumber: string;
      registeredAt: Date;
    }
  ) {
    const createData: Prisma.PlayerUncheckedCreateInput = data;
    return prisma.player.create({ data: createData, omit: { photo: true } });
  },

  update(id: string, data: PlayerWriteData) {
    const updateData: Prisma.PlayerUncheckedUpdateInput = data;
    return prisma.player.update({ where: { id }, data: updateData, omit: { photo: true } });
  },

  delete(id: string) {
    return prisma.player.delete({ where: { id } });
  },
};
