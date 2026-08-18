import type { PrismaClient } from "../../app/generated/prisma/client";
import { readJson } from "./read-json";
import { matchKey, type CardSeed } from "./types";

export async function seedCards(
  prisma: PrismaClient,
  matchesByKey: Map<string, string>,
  playersByRegistration: Map<string, string>
) {
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
  return cardsByPlayerAndMatchday;
}
