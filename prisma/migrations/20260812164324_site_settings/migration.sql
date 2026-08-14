-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Liga de Futbol',
    "logo" BYTEA,
    "logo_type" TEXT,
    "primary_color" TEXT NOT NULL DEFAULT '#0d9488',
    "background_color" TEXT NOT NULL DEFAULT '#eef3f1',

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- Seed the single settings row the app always reads/writes.
INSERT INTO "site_settings" ("id") VALUES ('00000000-0000-4000-8000-000000000002');
