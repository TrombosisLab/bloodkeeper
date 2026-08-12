CREATE TYPE "DiceRollSource" AS ENUM (
  'MANUAL',
  'CHARACTER',
  'ACTION'
);

CREATE TYPE "DiceRollVisibility" AS ENUM (
  'CONTEXTUAL',
  'PRIVATE'
);

CREATE TABLE "dice_roll_records" (
  "id" UUID NOT NULL,
  "actorId" UUID NOT NULL,
  "characterId" UUID,
  "chronicleId" UUID,
  "sessionId" UUID,
  "rerollParentId" UUID,
  "source" "DiceRollSource" NOT NULL,
  "visibility" "DiceRollVisibility" NOT NULL DEFAULT 'CONTEXTUAL',
  "description" TEXT,
  "rulesVersion" TEXT NOT NULL,
  "poolSnapshot" JSONB NOT NULL,
  "rollSnapshot" JSONB NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "dice_roll_records_pkey"
    PRIMARY KEY ("id"),
  CONSTRAINT "dice_roll_records_description_check"
    CHECK (
      "description" IS NULL
      OR (
        length(btrim("description")) > 0
        AND length("description") <= 160
      )
    ),
  CONSTRAINT "dice_roll_records_rules_version_check"
    CHECK (
      length(btrim("rulesVersion")) > 0
      AND length("rulesVersion") <= 64
    ),
  CONSTRAINT "dice_roll_records_snapshot_objects_check"
    CHECK (
      jsonb_typeof("poolSnapshot") = 'object'
      AND jsonb_typeof("rollSnapshot") = 'object'
    ),
  CONSTRAINT "dice_roll_records_session_context_check"
    CHECK (
      "sessionId" IS NULL
      OR "chronicleId" IS NOT NULL
    ),
  CONSTRAINT "dice_roll_records_reroll_parent_check"
    CHECK (
      "rerollParentId" IS NULL
      OR "rerollParentId" <> "id"
    )
);

CREATE INDEX "dice_roll_records_actorId_createdAt_id_idx"
  ON "dice_roll_records"("actorId", "createdAt", "id");

CREATE INDEX "dice_roll_records_characterId_createdAt_id_idx"
  ON "dice_roll_records"("characterId", "createdAt", "id");

CREATE INDEX "dice_roll_records_chronicleId_visibility_createdAt_id_idx"
  ON "dice_roll_records"("chronicleId", "visibility", "createdAt", "id");

CREATE INDEX "dice_roll_records_sessionId_createdAt_id_idx"
  ON "dice_roll_records"("sessionId", "createdAt", "id");

CREATE INDEX "dice_roll_records_rerollParentId_idx"
  ON "dice_roll_records"("rerollParentId");

ALTER TABLE "dice_roll_records"
  ADD CONSTRAINT "dice_roll_records_actorId_fkey"
  FOREIGN KEY ("actorId")
  REFERENCES "users"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "dice_roll_records"
  ADD CONSTRAINT "dice_roll_records_characterId_fkey"
  FOREIGN KEY ("characterId")
  REFERENCES "characters"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "dice_roll_records"
  ADD CONSTRAINT "dice_roll_records_chronicleId_fkey"
  FOREIGN KEY ("chronicleId")
  REFERENCES "chronicles"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "dice_roll_records"
  ADD CONSTRAINT "dice_roll_records_sessionId_fkey"
  FOREIGN KEY ("sessionId")
  REFERENCES "chronicle_sessions"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "dice_roll_records"
  ADD CONSTRAINT "dice_roll_records_rerollParentId_fkey"
  FOREIGN KEY ("rerollParentId")
  REFERENCES "dice_roll_records"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

CREATE FUNCTION "validate_dice_roll_context"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  linked_chronicle UUID;
BEGIN
  IF NEW."sessionId" IS NOT NULL THEN
    SELECT "chronicleId"
      INTO linked_chronicle
      FROM "chronicle_sessions"
      WHERE "id" = NEW."sessionId";

    IF FOUND AND linked_chronicle IS DISTINCT FROM NEW."chronicleId" THEN
      RAISE EXCEPTION 'Dice roll session does not belong to chronicle';
    END IF;
  END IF;

  IF NEW."characterId" IS NOT NULL AND NEW."chronicleId" IS NOT NULL THEN
    SELECT "chronicleId"
      INTO linked_chronicle
      FROM "characters"
      WHERE "id" = NEW."characterId";

    IF FOUND AND linked_chronicle IS DISTINCT FROM NEW."chronicleId" THEN
      RAISE EXCEPTION 'Dice roll character does not belong to chronicle';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER "dice_roll_records_context_consistency"
BEFORE INSERT ON "dice_roll_records"
FOR EACH ROW
EXECUTE FUNCTION "validate_dice_roll_context"();

CREATE FUNCTION "reject_dice_roll_record_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Dice roll records are immutable';
END;
$$;

CREATE TRIGGER "dice_roll_records_immutable"
BEFORE UPDATE OR DELETE ON "dice_roll_records"
FOR EACH ROW
EXECUTE FUNCTION "reject_dice_roll_record_mutation"();
