CREATE TABLE "character_rouse_check_operations" (
  "characterId" UUID NOT NULL,
  "operationId" UUID NOT NULL,
  "actorId" UUID NOT NULL,
  "reason" TEXT NOT NULL,
  "forced" BOOLEAN NOT NULL DEFAULT false,
  "bloodPotency" INTEGER,
  "disciplinePowerLevel" INTEGER,
  "rolls" JSONB NOT NULL,
  "selectedResult" INTEGER NOT NULL,
  "success" BOOLEAN NOT NULL,
  "hungerBefore" INTEGER NOT NULL,
  "hungerAfter" INTEGER NOT NULL,
  "consequence" TEXT NOT NULL,
  "consequenceDifficulty" INTEGER,
  "rollHistoryId" UUID NOT NULL,
  "characterRevision" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "character_rouse_check_operations_pkey"
    PRIMARY KEY ("characterId", "operationId"),

  CONSTRAINT "character_rouse_check_operations_reason_check"
    CHECK (
      "reason" IN (
        'awakening',
        'blushOfLife',
        'bloodSurge',
        'healing',
        'disciplinePower',
        'ritualOrCeremony',
        'other'
      )
    ),

  CONSTRAINT "character_rouse_check_operations_rolls_check"
    CHECK (
      jsonb_typeof("rolls") = 'array'
      AND jsonb_array_length("rolls") BETWEEN 1 AND 2
    ),

  CONSTRAINT "character_rouse_check_operations_selected_result_check"
    CHECK ("selectedResult" BETWEEN 1 AND 10),

  CONSTRAINT "character_rouse_check_operations_hunger_check"
    CHECK (
      "hungerBefore" BETWEEN 0 AND 5
      AND "hungerAfter" BETWEEN 0 AND 5
      AND (
        ("success" = true AND "hungerAfter" = "hungerBefore")
        OR
        (
          "success" = false
          AND "hungerAfter" = LEAST(5, "hungerBefore" + 1)
        )
      )
    ),

  CONSTRAINT "character_rouse_check_operations_discipline_context_check"
    CHECK (
      (
        "reason" = 'disciplinePower'
        AND "bloodPotency" IS NOT NULL
        AND "bloodPotency" >= 0
        AND "disciplinePowerLevel" BETWEEN 1 AND 5
      )
      OR
      (
        "reason" <> 'disciplinePower'
        AND "bloodPotency" IS NULL
        AND "disciplinePowerLevel" IS NULL
      )
    ),

  CONSTRAINT "character_rouse_check_operations_consequence_check"
    CHECK (
      (
        "consequence" = 'none'
        AND (
          "success" = true
          OR "hungerBefore" < 5
        )
        AND "consequenceDifficulty" IS NULL
      )
      OR
      (
        "consequence" = 'torporTriggered'
        AND "success" = false
        AND "hungerBefore" = 5
        AND "reason" = 'awakening'
        AND "consequenceDifficulty" IS NULL
      )
      OR
      (
        "consequence" = 'hungerFrenzyTestRequired'
        AND "success" = false
        AND "hungerBefore" = 5
        AND "reason" <> 'awakening'
        AND "consequenceDifficulty" = 4
      )
    ),

  CONSTRAINT "character_rouse_check_operations_revision_check"
    CHECK ("characterRevision" >= 2)
);

CREATE UNIQUE INDEX
  "character_rouse_check_operations_rollHistoryId_key"
ON "character_rouse_check_operations"("rollHistoryId");

CREATE INDEX
  "character_rouse_check_operations_characterId_createdAt_idx"
ON "character_rouse_check_operations"(
  "characterId",
  "createdAt"
);

CREATE INDEX
  "character_rouse_check_operations_actorId_createdAt_idx"
ON "character_rouse_check_operations"(
  "actorId",
  "createdAt"
);

ALTER TABLE "character_rouse_check_operations"
ADD CONSTRAINT
  "character_rouse_check_operations_characterId_fkey"
FOREIGN KEY ("characterId")
REFERENCES "characters"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "character_rouse_check_operations"
ADD CONSTRAINT
  "character_rouse_check_operations_actorId_fkey"
FOREIGN KEY ("actorId")
REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "character_rouse_check_operations"
ADD CONSTRAINT
  "character_rouse_check_operations_rollHistoryId_fkey"
FOREIGN KEY ("rollHistoryId")
REFERENCES "dice_roll_records"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
