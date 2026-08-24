-- DropIndex
DROP INDEX "match_evidence_match_id_idx";

-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "result_edited_at" TIMESTAMP(3),
ADD COLUMN     "result_edited_by_id" TEXT;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_result_edited_by_id_fkey" FOREIGN KEY ("result_edited_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
