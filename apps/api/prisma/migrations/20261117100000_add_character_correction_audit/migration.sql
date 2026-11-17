ALTER TYPE "AdvantageSelectionOrigin" ADD VALUE 'NARRATOR_CORRECTION';

CREATE TABLE "character_correction_audits" (
    "id" UUID NOT NULL,
    "characterId" UUID NOT NULL,
    "chronicleId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "before" JSONB NOT NULL,
    "after" JSONB NOT NULL,
    "revisionBefore" INTEGER NOT NULL,
    "revisionAfter" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "character_correction_audits_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "character_correction_audits_reason_check" CHECK (length(btrim("reason")) BETWEEN 5 AND 500),
    CONSTRAINT "character_correction_audits_revision_check" CHECK ("revisionAfter" = "revisionBefore" + 1)
);

CREATE INDEX "character_correction_audits_characterId_createdAt_idx"
    ON "character_correction_audits"("characterId", "createdAt");
CREATE INDEX "character_correction_audits_chronicleId_createdAt_idx"
    ON "character_correction_audits"("chronicleId", "createdAt");
CREATE INDEX "character_correction_audits_actorId_createdAt_idx"
    ON "character_correction_audits"("actorId", "createdAt");

ALTER TABLE "character_correction_audits"
    ADD CONSTRAINT "character_correction_audits_characterId_fkey"
    FOREIGN KEY ("characterId") REFERENCES "characters"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "character_correction_audits"
    ADD CONSTRAINT "character_correction_audits_chronicleId_fkey"
    FOREIGN KEY ("chronicleId") REFERENCES "chronicles"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "character_correction_audits"
    ADD CONSTRAINT "character_correction_audits_actorId_fkey"
    FOREIGN KEY ("actorId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
