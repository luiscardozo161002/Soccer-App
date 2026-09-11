-- 3-letter prefix used to build player folios (ej. "TIG-001"). Nullable —
-- existing teams get backfilled by a script (prisma/seeds/backfill-team-folio-prefixes.ts),
-- not by this migration.
-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "folio_prefix" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "teams_folio_prefix_key" ON "teams"("folio_prefix");
