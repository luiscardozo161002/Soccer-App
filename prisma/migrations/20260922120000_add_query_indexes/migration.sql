CREATE INDEX "seasons_status_start_date_idx" ON "seasons"("status", "start_date");
CREATE INDEX "teams_category_name_idx" ON "teams"("category", "name");
CREATE INDEX "players_team_id_name_idx" ON "players"("team_id", "name");
CREATE INDEX "fields_name_idx" ON "fields"("name");

CREATE INDEX "matches_season_id_status_matchday_date_idx"
  ON "matches"("season_id", "status", "matchday", "date");
CREATE INDEX "matches_home_team_id_idx" ON "matches"("home_team_id");
CREATE INDEX "matches_away_team_id_idx" ON "matches"("away_team_id");
CREATE INDEX "matches_field_id_date_time_matchday_idx"
  ON "matches"("field_id", "date", "time", "matchday");

CREATE INDEX "cards_match_id_recorded_at_idx" ON "cards"("match_id", "recorded_at");
CREATE INDEX "cards_player_id_recorded_at_idx" ON "cards"("player_id", "recorded_at");
CREATE INDEX "sanctions_card_id_idx" ON "sanctions"("card_id");
CREATE INDEX "sanctions_fulfilled_matchday_start_matchday_end_idx"
  ON "sanctions"("fulfilled", "matchday_start", "matchday_end");
CREATE INDEX "card_reason_configs_card_type_active_idx"
  ON "card_reason_configs"("card_type", "active");
CREATE INDEX "point_adjustments_season_id_team_id_idx"
  ON "point_adjustments"("season_id", "team_id");
CREATE INDEX "users_role_created_at_idx" ON "users"("role", "created_at");
CREATE INDEX "users_status_role_idx" ON "users"("status", "role");
