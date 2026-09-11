-- Site-wide language for the public site, set by the admin. DEFAULT covers
-- the existing row with no manual backfill needed.
-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "locale" TEXT NOT NULL DEFAULT 'es-MX';
