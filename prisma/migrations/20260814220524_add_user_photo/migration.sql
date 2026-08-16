-- AlterTable
ALTER TABLE "users" ADD COLUMN     "photo" BYTEA,
ADD COLUMN     "photo_type" TEXT,
ADD COLUMN     "photo_updated_at" TIMESTAMP(3);
