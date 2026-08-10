-- View: standings (calculated, not stored)
-- Not represented in schema.prisma because Prisma does not manage SQL
-- views through its model layer; this migration is hand-written to keep
-- it tracked in migration history like the rest of the schema.
CREATE VIEW standings AS
WITH results AS (
    SELECT home_team_id AS team_id,
           CASE WHEN home_goals > away_goals THEN 1 ELSE 0 END AS won,
           CASE WHEN home_goals = away_goals THEN 1 ELSE 0 END AS drawn,
           CASE WHEN home_goals < away_goals THEN 1 ELSE 0 END AS lost,
           home_goals AS goals_for,
           away_goals AS goals_against
    FROM matches
    WHERE status = 'played'
    UNION ALL
    SELECT away_team_id,
           CASE WHEN away_goals > home_goals THEN 1 ELSE 0 END,
           CASE WHEN away_goals = home_goals THEN 1 ELSE 0 END,
           CASE WHEN away_goals < home_goals THEN 1 ELSE 0 END,
           away_goals,
           home_goals
    FROM matches
    WHERE status = 'played'
),
aggregated AS (
    SELECT team_id,
           COUNT(*) AS played,
           SUM(won) AS won,
           SUM(drawn) AS drawn,
           SUM(lost) AS lost,
           SUM(goals_for) AS goals_for,
           SUM(goals_against) AS goals_against
    FROM results
    GROUP BY team_id
)
SELECT
    t.id AS team_id,
    t.name,
    COALESCE(a.played, 0) AS played,
    (SELECT COUNT(*) FROM matches m
       WHERE m.status <> 'played'
         AND (m.home_team_id = t.id OR m.away_team_id = t.id)) AS pending,
    COALESCE(a.won, 0) AS won,
    COALESCE(a.drawn, 0) AS drawn,
    COALESCE(a.lost, 0) AS lost,
    COALESCE(a.goals_for, 0) AS goals_for,
    COALESCE(a.goals_against, 0) AS goals_against,
    COALESCE(a.goals_for, 0) - COALESCE(a.goals_against, 0) AS goal_difference,
    COALESCE(a.won, 0) * 3 + COALESCE(a.drawn, 0)
        + COALESCE((SELECT SUM(points) FROM point_adjustments p WHERE p.team_id = t.id), 0) AS points
FROM teams t
LEFT JOIN aggregated a ON a.team_id = t.id;
