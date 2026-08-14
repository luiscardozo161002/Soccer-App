import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function readJson<T>(fileName: string): T {
  const filePath = path.join(__dirname, "seed-data", fileName);
  return JSON.parse(readFileSync(filePath, "utf-8"));
}

type TeamSeed = { name: string };
type FieldSeed = { name: string; location?: string };
type PlayerSeed = {
  team: string;
  name: string;
  registrationNumber: string;
  birthDate?: string;
};
type MatchSeed = {
  homeTeam: string;
  awayTeam: string;
  field: string;
  matchday: number;
  date: string;
  time: string;
  status?: "scheduled" | "played" | "postponed" | "cancelled";
  homeGoals?: number;
  awayGoals?: number;
};
type CardSeed = {
  player: string;
  match: { homeTeam: string; awayTeam: string; matchday: number };
  type: "yellow" | "red";
  detail?: string;
  amount?: number;
};
type SanctionSeed = {
  player: string;
  cardMatchday: number;
  matchdayStart: number;
  matchdayEnd: number;
  matchesSuspended: number;
};

const matchKey = (homeTeam: string, awayTeam: string, matchday: number) =>
  `${homeTeam}|${awayTeam}|${matchday}`;

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

  const season = await prisma.season.create({ data: { name: `Liga ${new Date().getFullYear()}` } });

  const teamsData = readJson<TeamSeed[]>("teams.json");
  const teamsByName = new Map<string, string>();
  for (const t of teamsData) {
    const team = await prisma.team.create({ data: t });
    teamsByName.set(t.name, team.id);
  }

  const fieldsData = readJson<FieldSeed[]>("fields.json");
  const fieldsByName = new Map<string, string>();
  for (const f of fieldsData) {
    const field = await prisma.field.create({ data: f });
    fieldsByName.set(f.name, field.id);
  }

  const playersData = readJson<PlayerSeed[]>("players.json");
  const playersByRegistration = new Map<string, string>();
  for (const p of playersData) {
    const teamId = teamsByName.get(p.team);
    if (!teamId) throw new Error(`Unknown team "${p.team}" referenced in players.json`);

    const player = await prisma.player.create({
      data: {
        teamId,
        name: p.name,
        registrationNumber: p.registrationNumber,
        birthDate: p.birthDate ? new Date(p.birthDate) : undefined,
      },
    });
    playersByRegistration.set(p.registrationNumber, player.id);
  }

  const matchesData = readJson<MatchSeed[]>("matches.json");
  const matchesByKey = new Map<string, string>();
  for (const m of matchesData) {
    const homeTeamId = teamsByName.get(m.homeTeam);
    const awayTeamId = teamsByName.get(m.awayTeam);
    const fieldId = fieldsByName.get(m.field);
    if (!homeTeamId || !awayTeamId) {
      throw new Error(`Unknown team in match "${m.homeTeam}" vs "${m.awayTeam}"`);
    }
    if (!fieldId) throw new Error(`Unknown field "${m.field}" referenced in matches.json`);

    const match = await prisma.match.create({
      data: {
        seasonId: season.id,
        homeTeamId,
        awayTeamId,
        fieldId,
        matchday: m.matchday,
        date: new Date(m.date),
        time: m.time,
        status: m.status ?? "scheduled",
        homeGoals: m.homeGoals,
        awayGoals: m.awayGoals,
      },
    });
    matchesByKey.set(matchKey(m.homeTeam, m.awayTeam, m.matchday), match.id);
  }

  const cardsData = readJson<CardSeed[]>("cards.json");
  const cardsByPlayerAndMatchday = new Map<string, string>();
  for (const c of cardsData) {
    const playerId = playersByRegistration.get(c.player);
    const matchId = matchesByKey.get(matchKey(c.match.homeTeam, c.match.awayTeam, c.match.matchday));
    if (!playerId) throw new Error(`Unknown player "${c.player}" referenced in cards.json`);
    if (!matchId) {
      throw new Error(`Unknown match for player "${c.player}" referenced in cards.json`);
    }

    const card = await prisma.card.create({
      data: { playerId, matchId, type: c.type, detail: c.detail, amount: c.amount },
    });
    cardsByPlayerAndMatchday.set(`${c.player}|${c.match.matchday}`, card.id);
  }

  const sanctionsData = readJson<SanctionSeed[]>("sanctions.json");
  for (const s of sanctionsData) {
    const cardId = cardsByPlayerAndMatchday.get(`${s.player}|${s.cardMatchday}`);
    if (!cardId) {
      throw new Error(`Unknown card for player "${s.player}" at matchday ${s.cardMatchday}`);
    }

    await prisma.sanction.create({
      data: {
        cardId,
        matchdayStart: s.matchdayStart,
        matchdayEnd: s.matchdayEnd,
        matchesSuspended: s.matchesSuspended,
      },
    });
  }

  console.log(
    `Seeded ${teamsData.length} teams, ${fieldsData.length} fields, ${playersData.length} players, ` +
      `${matchesData.length} matches, ${cardsData.length} cards, ${sanctionsData.length} sanctions`
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
