-- CreateEnum
CREATE TYPE "MatchEvidenceSlot" AS ENUM ('front', 'back');

-- AlterTable: add nullable first so existing rows can be backfilled
ALTER TABLE "match_evidence" ADD COLUMN "slot" "MatchEvidenceSlot";

-- Backfill: order each match's existing rows by created_at, first -> front,
-- second -> back. Anything beyond 2 per match (shouldn't exist, but the
-- prior open-gallery version allowed up to 10) is dropped so the upcoming
-- unique constraint can be added safely.
WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY match_id ORDER BY created_at ASC) AS rn
  FROM "match_evidence"
)
UPDATE "match_evidence" AS me
SET "slot" = CASE WHEN ranked.rn = 1 THEN 'front'::"MatchEvidenceSlot" ELSE 'back'::"MatchEvidenceSlot" END
FROM ranked
WHERE me.id = ranked.id AND ranked.rn <= 2;

DELETE FROM "match_evidence" WHERE "slot" IS NULL;

-- AlterTable: now safe to require it
ALTER TABLE "match_evidence" ALTER COLUMN "slot" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "match_evidence_match_id_slot_key" ON "match_evidence"("match_id", "slot");
