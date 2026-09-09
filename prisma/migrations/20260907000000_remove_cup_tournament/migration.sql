-- Remove the standalone Cup ("Copa") feature — no longer needed.
-- DropForeignKey
ALTER TABLE "cup_entries" DROP CONSTRAINT "cup_entries_cup_id_fkey";

-- DropForeignKey
ALTER TABLE "cup_entries" DROP CONSTRAINT "cup_entries_team_id_fkey";

-- DropForeignKey
ALTER TABLE "cup_matches" DROP CONSTRAINT "cup_matches_away_team_id_fkey";

-- DropForeignKey
ALTER TABLE "cup_matches" DROP CONSTRAINT "cup_matches_cup_id_fkey";

-- DropForeignKey
ALTER TABLE "cup_matches" DROP CONSTRAINT "cup_matches_field_id_fkey";

-- DropForeignKey
ALTER TABLE "cup_matches" DROP CONSTRAINT "cup_matches_home_team_id_fkey";

-- DropTable
DROP TABLE "cup_entries";

-- DropTable
DROP TABLE "cup_matches";

-- DropTable
DROP TABLE "cups";

-- DropEnum
DROP TYPE "CupEntryStatus";

-- DropEnum
DROP TYPE "CupMatchStatus";

-- DropEnum
DROP TYPE "CupStatus";
