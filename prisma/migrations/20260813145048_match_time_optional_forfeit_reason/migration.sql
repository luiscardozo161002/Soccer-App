-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "forfeit_reason" TEXT,
ALTER COLUMN "time" DROP NOT NULL;
