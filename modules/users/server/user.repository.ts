import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/app/generated/prisma/client";
import type { Role } from "@/lib/auth/roles";
import type { EntityStatus } from "@/modules/teams/team.types";
import type { ListUsersQuery } from "../user.schema";

const publicSelect = {
  id: true,
  username: true,
  email: true,
  phoneNumber: true,
  photoType: true,
  photoUpdatedAt: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

export interface UserWriteData {
  username?: string;
  email?: string;
  phoneNumber?: string | null;
  passwordHash?: string;
  role?: Role;
  status?: EntityStatus;
  photo?: Uint8Array<ArrayBuffer> | null;
  photoType?: string | null;
  photoUpdatedAt?: Date;
}

export const userRepository = {
  findByUsernameOrEmail(identifier: string) {
    return prisma.user.findFirst({ where: { OR: [{ username: identifier }, { email: identifier }] } });
  },
  findByResetToken(token: string) {
    return prisma.user.findUnique({ where: { resetToken: token } });
  },
  setResetToken(id: string, token: string, expiresAt: Date) {
    return prisma.user.update({
      where: { id },
      data: { resetToken: token, resetTokenExpiresAt: expiresAt },
    });
  },
  updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { passwordHash, resetToken: null, resetTokenExpiresAt: null },
    });
  },
  findMany({ page, pageSize, role }: ListUsersQuery) {
    return prisma.user.findMany({
      where: { role },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "asc" },
      select: publicSelect,
    });
  },
  count(role?: Role) {
    return prisma.user.count({ where: { role } });
  },
  countActive(role?: Role) {
    return prisma.user.count({ where: { status: "active", role } });
  },
  findById(id: string) {
    return prisma.user.findUnique({ where: { id }, select: publicSelect });
  },
  findPhoto(id: string) {
    return prisma.user.findUnique({ where: { id }, select: { photo: true, photoType: true } });
  },
  findByUsernameOrEmailPair(username: string, email: string) {
    return prisma.user.findFirst({ where: { OR: [{ username }, { email }] } });
  },
  findByUsernameOrEmailExcluding(username: string, email: string, excludeId: string) {
    return prisma.user.findFirst({
      where: { OR: [{ username }, { email }], id: { not: excludeId } },
    });
  },
  create(data: UserWriteData & { username: string; email: string; passwordHash: string; role: Role }) {
    const createData: Prisma.UserUncheckedCreateInput = data;
    return prisma.user.create({ data: createData, select: publicSelect });
  },
  update(id: string, data: UserWriteData) {
    const updateData: Prisma.UserUncheckedUpdateInput = data;
    return prisma.user.update({ where: { id }, data: updateData, select: publicSelect });
  },
  delete(id: string) {
    return prisma.user.delete({ where: { id } });
  },
};
