-- CreateEnum
CREATE TYPE "LeagueCategory" AS ENUM ('primera_division', 'division_ascenso', 'segunda_division');

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "category" "LeagueCategory" NOT NULL DEFAULT 'primera_division';

-- Redefine the standings view to also expose each team's category, so the
-- table can be filtered/marked by category without a second query.
DROP VIEW IF EXISTS "standings";

CREATE VIEW standings AS
WITH results AS (
    SELECT m.season_id,
           m.home_team_id AS team_id,
           CASE WHEN m.home_goals > m.away_goals THEN 1 ELSE 0 END AS won,
           CASE WHEN m.home_goals = m.away_goals THEN 1 ELSE 0 END AS drawn,
           CASE WHEN m.home_goals < m.away_goals THEN 1 ELSE 0 END AS lost,
           m.home_goals AS goals_for,
           m.away_goals AS goals_against
    FROM matches m
    WHERE m.status = 'played'
    UNION ALL
    SELECT m.season_id,
           m.away_team_id,
           CASE WHEN m.away_goals > m.home_goals THEN 1 ELSE 0 END,
           CASE WHEN m.away_goals = m.home_goals THEN 1 ELSE 0 END,
           CASE WHEN m.away_goals < m.home_goals THEN 1 ELSE 0 END,
           m.away_goals,
           m.home_goals
    FROM matches m
    WHERE m.status = 'played'
),
aggregated AS (
    SELECT season_id,
           team_id,
           COUNT(*) AS played,
           SUM(won) AS won,
           SUM(drawn) AS drawn,
           SUM(lost) AS lost,
           SUM(goals_for) AS goals_for,
           SUM(goals_against) AS goals_against
    FROM results
    GROUP BY season_id, team_id
)
SELECT
    s.id AS season_id,
    t.id AS team_id,
    t.name,
    t.category,
    COALESCE(a.played, 0) AS played,
    (SELECT COUNT(*) FROM matches m
       WHERE m.season_id = s.id
         AND m.status <> 'played'
         AND (m.home_team_id = t.id OR m.away_team_id = t.id)) AS pending,
    COALESCE(a.won, 0) AS won,
    COALESCE(a.drawn, 0) AS drawn,
    COALESCE(a.lost, 0) AS lost,
    COALESCE(a.goals_for, 0) AS goals_for,
    COALESCE(a.goals_against, 0) AS goals_against,
    COALESCE(a.goals_for, 0) - COALESCE(a.goals_against, 0) AS goal_difference,
    COALESCE(a.won, 0) * 3 + COALESCE(a.drawn, 0)
        + COALESCE((SELECT SUM(points) FROM point_adjustments p
                      WHERE p.team_id = t.id AND p.season_id = s.id), 0) AS points
FROM seasons s
CROSS JOIN teams t
LEFT JOIN aggregated a ON a.team_id = t.id AND a.season_id = s.id;
