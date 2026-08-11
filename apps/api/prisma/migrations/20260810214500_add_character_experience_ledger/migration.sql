CREATE TYPE "CharacterExperienceMovementType" AS ENUM (
  'GRANT',
  'SPEND',
  'CORRECTION'
);

CREATE TYPE "CharacterExperienceComponent" AS ENUM (
  'EARNED',
  'SPENT'
);

CREATE TABLE "character_experience_movements" (
  "id" UUID NOT NULL,
  "characterId" UUID NOT NULL,
  "actorId" UUID NOT NULL,
  "sessionId" UUID,
  "type" "CharacterExperienceMovementType" NOT NULL,
  "component" "CharacterExperienceComponent" NOT NULL,
  "amount" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "deduplicationKey" TEXT,
  "acquisitionType" TEXT,
  "acquisitionKey" TEXT,
  "correctsMovementId" UUID,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "character_experience_movements_pkey"
    PRIMARY KEY ("id"),
  CONSTRAINT "character_experience_movements_reason_check"
    CHECK (length(btrim("reason")) > 0),
  CONSTRAINT "character_experience_movements_deduplication_key_check"
    CHECK (
      "deduplicationKey" IS NULL
      OR length(btrim("deduplicationKey")) > 0
    ),
  CONSTRAINT "character_experience_movements_acquisition_fields_check"
    CHECK (
      ("acquisitionType" IS NULL AND "acquisitionKey" IS NULL)
      OR (
        length(btrim("acquisitionType")) > 0
        AND length(btrim("acquisitionKey")) > 0
      )
    ),
  CONSTRAINT "character_experience_movements_semantics_check"
    CHECK (
      (
        "type" = 'GRANT'
        AND "component" = 'EARNED'
        AND "amount" > 0
        AND "acquisitionType" IS NULL
        AND "acquisitionKey" IS NULL
        AND "correctsMovementId" IS NULL
      )
      OR (
        "type" = 'SPEND'
        AND "component" = 'SPENT'
        AND "amount" > 0
        AND "acquisitionType" IS NOT NULL
        AND "acquisitionKey" IS NOT NULL
        AND "correctsMovementId" IS NULL
      )
      OR (
        "type" = 'CORRECTION'
        AND "amount" <> 0
        AND "acquisitionType" IS NULL
        AND "acquisitionKey" IS NULL
        AND "correctsMovementId" IS NOT NULL
      )
    )
);

CREATE UNIQUE INDEX "character_experience_movements_characterId_deduplicationKey_key"
  ON "character_experience_movements"("characterId", "deduplicationKey");

CREATE INDEX "character_experience_movements_characterId_createdAt_idx"
  ON "character_experience_movements"("characterId", "createdAt");

CREATE INDEX "character_experience_movements_actorId_createdAt_idx"
  ON "character_experience_movements"("actorId", "createdAt");

CREATE INDEX "character_experience_movements_sessionId_idx"
  ON "character_experience_movements"("sessionId");

CREATE INDEX "character_experience_movements_correctsMovementId_idx"
  ON "character_experience_movements"("correctsMovementId");

ALTER TABLE "character_experience_movements"
  ADD CONSTRAINT "character_experience_movements_characterId_fkey"
  FOREIGN KEY ("characterId")
  REFERENCES "characters"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "character_experience_movements"
  ADD CONSTRAINT "character_experience_movements_actorId_fkey"
  FOREIGN KEY ("actorId")
  REFERENCES "users"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "character_experience_movements"
  ADD CONSTRAINT "character_experience_movements_sessionId_fkey"
  FOREIGN KEY ("sessionId")
  REFERENCES "chronicle_sessions"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "character_experience_movements"
  ADD CONSTRAINT "character_experience_movements_correctsMovementId_fkey"
  FOREIGN KEY ("correctsMovementId")
  REFERENCES "character_experience_movements"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

CREATE FUNCTION "reject_character_experience_movement_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Character experience movements are immutable';
END;
$$;

CREATE TRIGGER "character_experience_movements_immutable"
BEFORE UPDATE OR DELETE ON "character_experience_movements"
FOR EACH ROW
EXECUTE FUNCTION "reject_character_experience_movement_mutation"();
