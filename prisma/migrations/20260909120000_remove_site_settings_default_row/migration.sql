-- The "add site_settings" migration inserted a default singleton row so the
-- app would always find one. That's no longer how this project keeps data
-- in sync with the schema (see lib/repositories/settings.repository.ts):
-- get() now falls back to the same column defaults in-code, and the row
-- only gets persisted the first time an admin actually saves a change.
--
-- Remove that migration-inserted row, but only if it's still untouched —
-- if an admin already customized it, this is a no-op and the real data
-- stays exactly as-is.
DELETE FROM "site_settings"
WHERE "id" = '00000000-0000-4000-8000-000000000002'
  AND "name" = 'Liga de Futbol'
  AND "slogan" IS NULL
  AND "logo" IS NULL
  AND "primary_color" = '#0d9488'
  AND "background_color" = '#eef3f1';
