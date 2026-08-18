-- CreateEnum
CREATE TYPE "CupStatus" AS ENUM ('active', 'archived');

-- CreateEnum
CREATE TYPE "CupEntryStatus" AS ENUM ('active', 'eliminated', 'withdrawn');

-- CreateEnum
CREATE TYPE "CupMatchStatus" AS ENUM ('scheduled', 'played', 'postponed', 'cancelled');

-- CreateTable
CREATE TABLE "cups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "CupStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cup_entries" (
    "id" TEXT NOT NULL,
    "cup_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "status" "CupEntryStatus" NOT NULL DEFAULT 'active',
    "eliminated_reason" TEXT,
    "eliminated_at" TIMESTAMP(3),

    CONSTRAINT "cup_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cup_matches" (
    "id" TEXT NOT NULL,
    "cup_id" TEXT NOT NULL,
    "round" TEXT NOT NULL,
    "home_team_id" TEXT NOT NULL,
    "away_team_id" TEXT NOT NULL,
    "field_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TEXT,
    "home_goals" INTEGER,
    "away_goals" INTEGER,
    "forfeit" BOOLEAN NOT NULL DEFAULT false,
    "forfeit_reason" TEXT,
    "result_locked" BOOLEAN NOT NULL DEFAULT false,
    "status" "CupMatchStatus" NOT NULL DEFAULT 'scheduled',

    CONSTRAINT "cup_matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cup_entries_cup_id_team_id_key" ON "cup_entries"("cup_id", "team_id");

-- AddForeignKey
ALTER TABLE "cup_entries" ADD CONSTRAINT "cup_entries_cup_id_fkey" FOREIGN KEY ("cup_id") REFERENCES "cups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cup_entries" ADD CONSTRAINT "cup_entries_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cup_matches" ADD CONSTRAINT "cup_matches_cup_id_fkey" FOREIGN KEY ("cup_id") REFERENCES "cups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cup_matches" ADD CONSTRAINT "cup_matches_home_team_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cup_matches" ADD CONSTRAINT "cup_matches_away_team_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cup_matches" ADD CONSTRAINT "cup_matches_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields"("id") ON DELETE SET NULL ON UPDATE CASCADE;
