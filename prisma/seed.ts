import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";
import { seedSeason } from "./seeds/seed-season";
import { seedTeams } from "./seeds/seed-teams";
import { seedFields } from "./seeds/seed-fields";
import { seedPlayers } from "./seeds/seed-players";
import { seedMatches } from "./seeds/seed-matches";
import { seedCards } from "./seeds/seed-cards";
import { seedSanctions } from "./seeds/seed-sanctions";
import { seedAdminUsers } from "./seeds/seed-admin-users";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Reset in dependency order so FKs never block the reseed.
  await prisma.sanction.deleteMany();
  await prisma.card.deleteMany();
  await prisma.match.deleteMany();
  await prisma.pointAdjustment.deleteMany();
  await prisma.season.deleteMany();
  await prisma.player.deleteMany();
  await prisma.field.deleteMany();
  await prisma.team.deleteMany();

  const season = await seedSeason(prisma);
  const teamsByName = await seedTeams(prisma);
  const fieldsByName = await seedFields(prisma);
  const playersByRegistration = await seedPlayers(prisma, teamsByName);
  const matchesByKey = await seedMatches(prisma, season.id, teamsByName, fieldsByName);
  const cardsByPlayerAndMatchday = await seedCards(prisma, matchesByKey, playersByRegistration);
  const sanctionsCount = await seedSanctions(prisma, cardsByPlayerAndMatchday);
  const adminUsersCreated = await seedAdminUsers(prisma);

  console.log(
    `Seeded ${teamsByName.size} teams, ${fieldsByName.size} fields, ${playersByRegistration.size} players, ` +
      `${matchesByKey.size} matches, ${cardsByPlayerAndMatchday.size} cards, ${sanctionsCount} sanctions, ` +
      `${adminUsersCreated} admin user(s) created (existing admins are never touched)`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
