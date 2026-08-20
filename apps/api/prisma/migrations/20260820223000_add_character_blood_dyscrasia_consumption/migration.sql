-- SPEC-058-D3: identify and consume one acquired Dyscrasia instance.
--
-- The active instance is linked internally to the feeding operation that
-- acquired it. Historical D2 rows are backfilled when a matching operation
-- can be identified. Legacy rows that cannot be matched remain readable but
-- are not consumable until a new canonical feeding replaces them.

ALTER TABLE "character_blood_states"
ADD COLUMN "dyscrasiaSourceOperationId" UUID;

UPDATE "character_blood_states" AS state
SET "dyscrasiaSourceOperationId" = (
  SELECT operation."operationId"
  FROM "character_blood_resonance_operations" AS operation
  WHERE
    operation."characterId" = state."characterId"
    AND operation."dyscrasiaKey" = state."dyscrasiaKey"
    AND operation."dyscrasiaAcquisitionMode" =
      state."dyscrasiaAcquisitionMode"
  ORDER BY
    operation."createdAt" DESC,
    operation."operationId" DESC
  LIMIT 1
)
WHERE state."dyscrasiaKey" IS NOT NULL;

ALTER TABLE "character_blood_states"
ADD CONSTRAINT "character_blood_states_dyscrasia_source_shape_check"
CHECK (
  "dyscrasiaSourceOperationId" IS NULL
  OR (
    "dyscrasiaKey" IS NOT NULL
    AND "dyscrasiaAcquisitionMode" IS NOT NULL
  )
);

CREATE TABLE "character_blood_dyscrasia_consumption_operations" (
  "characterId" UUID NOT NULL,
  "operationId" UUID NOT NULL,
  "sourceBloodOperationId" UUID NOT NULL,
  "dyscrasiaKey" "CharacterBloodDyscrasiaKey" NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "character_blood_dyscrasia_consumption_operations_pkey"
    PRIMARY KEY ("characterId", "operationId")
);

CREATE UNIQUE INDEX
  "character_blood_dyscrasia_consumption_operations_characterId_sourceBloodOperationId_key"
ON "character_blood_dyscrasia_consumption_operations"(
  "characterId",
  "sourceBloodOperationId"
);

CREATE INDEX
  "character_blood_dyscrasia_consumption_operations_characterId_createdAt_idx"
ON "character_blood_dyscrasia_consumption_operations"(
  "characterId",
  "createdAt"
);

ALTER TABLE "character_blood_dyscrasia_consumption_operations"
ADD CONSTRAINT "character_blood_dyscrasia_consumption_operations_source_fkey"
FOREIGN KEY (
  "characterId",
  "sourceBloodOperationId"
)
REFERENCES "character_blood_resonance_operations"(
  "characterId",
  "operationId"
)
ON DELETE CASCADE
ON UPDATE CASCADE;
