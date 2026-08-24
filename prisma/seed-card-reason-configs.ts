import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { CARD_REASONS } from "../lib/constants/card-reasons";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// One-off, idempotent (upsert): seeds the card-reason price catalog from the
// existing CARD_REASONS labels, minus "Otro" (dropped — every reason must
// now have a configured price). Amounts start at 0; an admin sets the real
// prices from the catalog UI before this is used in production. Safe to
// re-run — never touches Card rows or existing catalog amounts.
async function main() {
  const reasons = CARD_REASONS.filter((r) => r !== "Otro");
  let created = 0;
  let skipped = 0;

  for (const reason of reasons) {
    for (const cardType of ["yellow", "red"] as const) {
      const existing = await prisma.cardReasonConfig.findUnique({
        where: { cardType_reason: { cardType, reason } },
      });
      if (existing) {
        skipped++;
        continue;
      }
      await prisma.cardReasonConfig.create({ data: { cardType, reason, amount: 0 } });
      created++;
    }
  }

  console.log(`Card reason catalog: ${created} created, ${skipped} already existed.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
