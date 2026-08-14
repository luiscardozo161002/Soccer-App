import { prisma } from "@/lib/prisma";
import type { CreateUserDto, ListUsersQuery, UpdateUserDto } from "@/lib/validation/user.schema";

// Never send the password hash or reset token to the client.
const publicSelect = {
  id: true,
  username: true,
  email: true,
  phoneNumber: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

export const userRepository = {
  findByUsernameOrEmail(identifier: string) {
    return prisma.user.findFirst({
      where: { OR: [{ username: identifier }, { email: identifier }] },
    });
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

  findMany({ page, pageSize }: ListUsersQuery) {
    return prisma.user.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "asc" },
      select: publicSelect,
    });
  },

  count() {
    return prisma.user.count();
  },

  countActive() {
    return prisma.user.count({ where: { status: "active" } });
  },

  findById(id: string) {
    return prisma.user.findUnique({ where: { id }, select: publicSelect });
  },

  findByUsernameOrEmailPair(username: string, email: string) {
    return prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
  },

  findByUsernameOrEmailExcluding(username: string, email: string, excludeId: string) {
    return prisma.user.findFirst({
      where: { OR: [{ username }, { email }], id: { not: excludeId } },
    });
  },

  create(data: CreateUserDto & { passwordHash: string }) {
    return prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        phoneNumber: data.phoneNumber || undefined,
        passwordHash: data.passwordHash,
        role: data.role,
      },
      select: publicSelect,
    });
  },

  update(id: string, data: UpdateUserDto) {
    return prisma.user.update({
      where: { id },
      data: {
        username: data.username,
        email: data.email,
        phoneNumber: data.phoneNumber,
        role: data.role,
        status: data.status,
      },
      select: publicSelect,
    });
  },

  delete(id: string) {
    return prisma.user.delete({ where: { id } });
  },
};
