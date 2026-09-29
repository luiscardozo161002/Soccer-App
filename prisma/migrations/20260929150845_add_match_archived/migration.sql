-- DropIndex
DROP INDEX "matches_season_id_status_matchday_date_idx";

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "archived" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "matches_season_id_status_archived_matchday_date_idx" ON "matches"("season_id", "status", "archived", "matchday", "date");
