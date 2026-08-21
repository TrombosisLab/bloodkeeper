CREATE TABLE
  "character_blush_of_life_exemption_operations" (
    "characterId" UUID NOT NULL,
    "operationId" UUID NOT NULL,
    "actorId" UUID NOT NULL,
    "dyscrasiaKey"
      "CharacterBloodDyscrasiaKey" NOT NULL,
    "sourceBloodOperationId" UUID NOT NULL,
    "hungerBefore" INTEGER NOT NULL,
    "hungerAfter" INTEGER NOT NULL,
    "characterRevision" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL
      DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT
      "character_blush_of_life_exemption_operations_pkey"
      PRIMARY KEY (
        "characterId",
        "operationId"
      ),

    CONSTRAINT
      "character_blush_of_life_exemption_operations_hunger_check"
      CHECK (
        "hungerBefore" BETWEEN 0 AND 5
        AND
        "hungerAfter" = "hungerBefore"
      ),

    CONSTRAINT
      "character_blush_of_life_exemption_operations_revision_check"
      CHECK (
        "characterRevision" >= 2
      )
  );

CREATE INDEX
  "character_blush_of_life_exemption_operations_characterId_createdAt_idx"
ON
  "character_blush_of_life_exemption_operations"(
    "characterId",
    "createdAt"
  );

CREATE INDEX
  "character_blush_of_life_exemption_operations_actorId_createdAt_idx"
ON
  "character_blush_of_life_exemption_operations"(
    "actorId",
    "createdAt"
  );

CREATE INDEX
  "character_blush_of_life_exemption_operations_source_idx"
ON
  "character_blush_of_life_exemption_operations"(
    "characterId",
    "sourceBloodOperationId"
  );

ALTER TABLE
  "character_blush_of_life_exemption_operations"
ADD CONSTRAINT
  "character_blush_of_life_exemption_operations_characterId_fkey"
FOREIGN KEY ("characterId")
REFERENCES "characters"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE
  "character_blush_of_life_exemption_operations"
ADD CONSTRAINT
  "character_blush_of_life_exemption_operations_actorId_fkey"
FOREIGN KEY ("actorId")
REFERENCES "users"("id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE
  "character_blush_of_life_exemption_operations"
ADD CONSTRAINT
  "character_blush_of_life_exemption_operations_source_fkey"
FOREIGN KEY (
  "characterId",
  "sourceBloodOperationId"
)
REFERENCES
  "character_blood_resonance_operations"(
    "characterId",
    "operationId"
  )
ON DELETE CASCADE
ON UPDATE CASCADE;
