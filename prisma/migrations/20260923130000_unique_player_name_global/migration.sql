-- Global case-insensitive player names, regardless of team or category.
CREATE UNIQUE INDEX "players_name_ci_key" ON "players" (lower(btrim("name")));
