-- AlterTable
ALTER TABLE "players" ADD COLUMN     "photo_updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "logo_updated_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "photo_updated_at" TIMESTAMP(3);
