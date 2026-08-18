import type { PrismaClient } from "../../app/generated/prisma/client";
import { hashPassword } from "../../lib/auth/password";
import { readJson } from "./read-json";
import type { AdminUserSeed } from "./types";


export async function seedAdminUsers(prisma: PrismaClient) {
  const usersData = readJson<AdminUserSeed[]>("admin-users.json");
  let created = 0;
  for (const u of usersData) {
    const existing = await prisma.user.findUnique({ where: { username: u.username } });
    if (existing) continue;
    await prisma.user.create({
      data: {
        username: u.username,
        email: u.email,
        phoneNumber: u.phoneNumber,
        passwordHash: hashPassword(u.password),
        role: "admin",
      },
    });
    created++;
  }
  return created;
}
