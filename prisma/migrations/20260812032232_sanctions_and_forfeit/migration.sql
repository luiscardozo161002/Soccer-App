-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "forfeit" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "sanctions" ADD COLUMN     "waived_by_payment" BOOLEAN NOT NULL DEFAULT false;
