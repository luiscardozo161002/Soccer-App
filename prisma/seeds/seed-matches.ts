import type { PrismaClient } from "../../app/generated/prisma/client";
import { readJson } from "./read-json";
import { matchKey, type MatchSeed } from "./types";

export async function seedMatches(
  prisma: PrismaClient,
  seasonId: string,
  teamsByName: Map<string, string>,
  fieldsByName: Map<string, string>
) {
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
        seasonId,
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
  return matchesByKey;
}
