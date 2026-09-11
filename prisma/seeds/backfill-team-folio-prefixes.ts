import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../app/generated/prisma/client";
import { suggestFolioPrefix } from "../../lib/utils/folio";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Idempotent: only assigns a prefix to teams that don't have one yet, so
// re-running it after new teams are added just fills in the new ones.
async function main() {
  const teams = await prisma.team.findMany({ orderBy: { name: "asc" } });
  const taken = new Set(teams.map((t) => t.folioPrefix).filter((p): p is string => !!p));

  let assigned = 0;
  for (const team of teams) {
    if (team.folioPrefix) continue;
    const prefix = suggestFolioPrefix(team.name, (p) => taken.has(p));
    taken.add(prefix);
    await prisma.team.update({ where: { id: team.id }, data: { folioPrefix: prefix } });
    console.log(`${team.name.padEnd(30)} -> ${prefix}`);
    assigned++;
  }

  console.log(`\nPrefijos asignados: ${assigned} (de ${teams.length} equipos). Revísalos en /admin/teams y corrige los que no te convenzan.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
