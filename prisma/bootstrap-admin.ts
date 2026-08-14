import "dotenv/config";
import { randomBytes } from "crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { hashPassword } from "../lib/auth/password";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// One-off, idempotent: only creates an admin if the users table is empty, so
// re-running this never resets credentials someone already changed.
async function main() {
  const existing = await prisma.user.findFirst();
  if (existing) {
    console.log(`Ya existe al menos un usuario (${existing.username}); no se creó ninguno nuevo.`);
    return;
  }

  const password = randomBytes(9).toString("base64url");
  const user = await prisma.user.create({
    data: {
      username: "admin",
      email: "luiscardozo161002@gmail.com",
      passwordHash: hashPassword(password),
      role: "admin",
    },
  });

  console.log("=== Usuario administrador creado ===");
  console.log(`Usuario:    ${user.username}`);
  console.log(`Contraseña: ${password}`);
  console.log("Guárdala ahora — no se volverá a mostrar. Puedes cambiarla después desde /forgot-password.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
