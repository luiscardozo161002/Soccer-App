import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";

export interface StandingsRow {
  teamId: string;
  name: string;
  category: string;
  played: number;
  pending: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export const standingsRepository = {
  findBySeason(seasonId: string) {
    return prisma.$queryRaw<StandingsRow[]>(Prisma.sql`
      SELECT
        team_id AS "teamId",
        name,
        category,
        played::int AS played,
        pending::int AS pending,
        won::int AS won,
        drawn::int AS drawn,
        lost::int AS lost,
        goals_for::int AS "goalsFor",
        goals_against::int AS "goalsAgainst",
        goal_difference::int AS "goalDifference",
        points::int AS points
      FROM standings
      WHERE season_id = ${seasonId}
      ORDER BY points DESC, "goalDifference" DESC, "goalsFor" DESC
    `);
  },
};
