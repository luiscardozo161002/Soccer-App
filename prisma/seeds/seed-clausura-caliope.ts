import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../app/generated/prisma/client";
import { SEASON, seedSeason } from "./season-seed";
import { seedTeams } from "./teams-seeds";
import { seedFields } from "./fields-seeds";
import { seedAdjustments } from "./adjustments-seed";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const seasonResult = await seedSeason(prisma);
  const teamsResult = await seedTeams(prisma);
  const fieldsResult = await seedFields(prisma);
  const adjustmentsResult = await seedAdjustments(prisma, seasonResult.season, teamsResult.teamIdByName);

  console.log("Seed complete:");
  console.log(`- Season "${SEASON.name}": ${seasonResult.created ? "created" : "already existed"}`);
  console.log(`- Teams: ${teamsResult.created} created, ${teamsResult.skipped} already existed`);
  console.log(`- Fields: ${fieldsResult.created} created, ${fieldsResult.skipped} already existed`);
  console.log(
    `- Standings adjustments: ${adjustmentsResult.created} created, ${adjustmentsResult.skipped} already existed`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
