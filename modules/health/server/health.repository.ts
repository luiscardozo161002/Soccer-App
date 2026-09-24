import { prisma } from "@/lib/prisma";

export const healthRepository = {
  async pingDatabase() {
    await prisma.$queryRaw`SELECT 1`;
  },
};
