import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { hashPassword } from "../lib/auth/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!password) {
    throw new Error("ADMIN_BOOTSTRAP_PASSWORD no está configurada en el entorno.");
  }
  await prisma.user.create({
    data: {
      username: "admin",
      email: "luiscardozo161002@gmail.com",
      passwordHash: hashPassword(password),
      role: "admin",
    },
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
