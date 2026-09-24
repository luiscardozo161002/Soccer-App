DROP INDEX IF EXISTS "sanctions_card_id_idx";
CREATE UNIQUE INDEX "sanctions_card_id_key" ON "sanctions"("card_id");
