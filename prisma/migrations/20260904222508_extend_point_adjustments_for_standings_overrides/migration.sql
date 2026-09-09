-- The view reads point_adjustments.points, so it must be dropped before
-- that column can be altered — recreated with the new shape below.
DROP VIEW IF EXISTS "standings";

-- AlterTable: extend point_adjustments into a full standings override —
-- delta columns for every stat, not just points — so a historical result
-- that was never loaded as a real match can still be reflected without
-- inventing a fake match record.
ALTER TABLE "point_adjustments"
  ADD COLUMN "played_delta" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "pending_delta" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "won_delta" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "drawn_delta" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lost_delta" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "goals_for_delta" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "goals_against_delta" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "points_delta" INTEGER NOT NULL DEFAULT 0;

-- Preserve any existing manual point adjustments under the new column name
-- before dropping the old one.
UPDATE "point_adjustments" SET "points_delta" = "points";

ALTER TABLE "point_adjustments" DROP COLUMN "points";

-- Redefine the standings view to fold every delta column into its matching
-- aggregate, instead of only points.
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
),
adjustments AS (
    SELECT season_id,
           team_id,
           SUM(played_delta) AS played_delta,
           SUM(pending_delta) AS pending_delta,
           SUM(won_delta) AS won_delta,
           SUM(drawn_delta) AS drawn_delta,
           SUM(lost_delta) AS lost_delta,
           SUM(goals_for_delta) AS goals_for_delta,
           SUM(goals_against_delta) AS goals_against_delta,
           SUM(points_delta) AS points_delta
    FROM point_adjustments
    WHERE status = 'active'
    GROUP BY season_id, team_id
)
SELECT
    s.id AS season_id,
    t.id AS team_id,
    t.name,
    t.category,
    COALESCE(a.played, 0) + COALESCE(adj.played_delta, 0) AS played,
    (SELECT COUNT(*) FROM matches m
       WHERE m.season_id = s.id
         AND m.status <> 'played'
         AND (m.home_team_id = t.id OR m.away_team_id = t.id)) + COALESCE(adj.pending_delta, 0) AS pending,
    COALESCE(a.won, 0) + COALESCE(adj.won_delta, 0) AS won,
    COALESCE(a.drawn, 0) + COALESCE(adj.drawn_delta, 0) AS drawn,
    COALESCE(a.lost, 0) + COALESCE(adj.lost_delta, 0) AS lost,
    COALESCE(a.goals_for, 0) + COALESCE(adj.goals_for_delta, 0) AS goals_for,
    COALESCE(a.goals_against, 0) + COALESCE(adj.goals_against_delta, 0) AS goals_against,
    (COALESCE(a.goals_for, 0) + COALESCE(adj.goals_for_delta, 0))
      - (COALESCE(a.goals_against, 0) + COALESCE(adj.goals_against_delta, 0)) AS goal_difference,
    (COALESCE(a.won, 0) + COALESCE(adj.won_delta, 0)) * 3
      + (COALESCE(a.drawn, 0) + COALESCE(adj.drawn_delta, 0))
      + COALESCE(adj.points_delta, 0) AS points
FROM seasons s
CROSS JOIN teams t
LEFT JOIN aggregated a ON a.team_id = t.id AND a.season_id = s.id
LEFT JOIN adjustments adj ON adj.team_id = t.id AND adj.season_id = s.id;
