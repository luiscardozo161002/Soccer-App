-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "referee_id" TEXT;

-- AlterTable
ALTER TABLE "players" ADD COLUMN     "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "seasons" ADD COLUMN     "min_matches_playoffs" INTEGER;

-- CreateTable
CREATE TABLE "match_evidence" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "photo" BYTEA NOT NULL,
    "photo_type" TEXT NOT NULL,
    "uploaded_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "match_evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sanction_matches" (
    "id" TEXT NOT NULL,
    "sanction_id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sanction_matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_reason_configs" (
    "id" TEXT NOT NULL,
    "card_type" "CardType" NOT NULL,
    "reason" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_reason_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "match_evidence_match_id_idx" ON "match_evidence"("match_id");

-- CreateIndex
CREATE UNIQUE INDEX "sanction_matches_sanction_id_match_id_key" ON "sanction_matches"("sanction_id", "match_id");

-- CreateIndex
CREATE UNIQUE INDEX "card_reason_configs_card_type_reason_key" ON "card_reason_configs"("card_type", "reason");

-- CreateIndex
CREATE INDEX "matches_referee_id_idx" ON "matches"("referee_id");

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_evidence" ADD CONSTRAINT "match_evidence_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match_evidence" ADD CONSTRAINT "match_evidence_uploaded_by_user_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanction_matches" ADD CONSTRAINT "sanction_matches_sanction_id_fkey" FOREIGN KEY ("sanction_id") REFERENCES "sanctions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sanction_matches" ADD CONSTRAINT "sanction_matches_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
