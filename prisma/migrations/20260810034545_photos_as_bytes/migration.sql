/*
  Warnings:

  - You are about to drop the column `photo_url` on the `players` table. All the data in the column will be lost.
  - You are about to drop the column `photo_url` on the `teams` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "players" DROP COLUMN "photo_url",
ADD COLUMN     "photo" BYTEA,
ADD COLUMN     "photo_type" TEXT;

-- AlterTable
ALTER TABLE "teams" DROP COLUMN "photo_url",
ADD COLUMN     "photo" BYTEA,
ADD COLUMN     "photo_type" TEXT;
