-- SPEC-058-B: persist active blood Resonance and idempotent feeding operations.

CREATE TYPE "CharacterBloodSourceKind" AS ENUM (
    'HUMAN',
    'ANIMAL'
);

CREATE TYPE "CharacterBloodResonanceKey" AS ENUM (
    'CHOLERIC',
    'MELANCHOLY',
    'PHLEGMATIC',
    'SANGUINE'
);

CREATE TYPE "CharacterBloodTemperament" AS ENUM (
    'FLEETING',
    'INTENSE',
    'ACUTE'
);

CREATE TYPE "CharacterBloodSpecialAffinityKey" AS ENUM (
    'ANIMAL_BLOOD',
    'RESONANCE_FREE'
);

ALTER TABLE "character_blood_states"
ADD COLUMN "resonanceSourceKind" "CharacterBloodSourceKind",
ADD COLUMN "resonanceKey" "CharacterBloodResonanceKey",
ADD COLUMN "resonanceTemperament" "CharacterBloodTemperament",
ADD COLUMN "resonanceSpecialAffinityKey" "CharacterBloodSpecialAffinityKey";

ALTER TABLE "character_blood_states"
ADD CONSTRAINT "character_blood_states_resonance_shape_check"
CHECK (
    (
        "resonanceSourceKind" IS NULL
        AND "resonanceKey" IS NULL
        AND "resonanceTemperament" IS NULL
        AND "resonanceSpecialAffinityKey" IS NULL
    )
    OR
    (
        "resonanceSourceKind" IS NOT NULL
        AND "resonanceKey" IS NOT NULL
        AND "resonanceTemperament" IS NOT NULL
        AND "resonanceSpecialAffinityKey" IS NULL
    )
    OR
    (
        "resonanceSourceKind" = 'ANIMAL'
        AND "resonanceKey" IS NULL
        AND "resonanceTemperament" IS NOT NULL
        AND "resonanceSpecialAffinityKey" = 'ANIMAL_BLOOD'
    )
    OR
    (
        "resonanceSourceKind" = 'HUMAN'
        AND "resonanceKey" IS NULL
        AND "resonanceTemperament" IS NULL
        AND "resonanceSpecialAffinityKey" = 'RESONANCE_FREE'
    )
);

CREATE TABLE "character_blood_resonance_operations" (
    "characterId" UUID NOT NULL,
    "operationId" UUID NOT NULL,
    "sourceKind" "CharacterBloodSourceKind" NOT NULL,
    "resonanceKey" "CharacterBloodResonanceKey",
    "temperament" "CharacterBloodTemperament",
    "specialAffinityKey" "CharacterBloodSpecialAffinityKey",
    "hungerSlaked" INTEGER NOT NULL,
    "hungerBefore" INTEGER NOT NULL,
    "hungerAfter" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "character_blood_resonance_operations_pkey"
      PRIMARY KEY ("characterId", "operationId"),

    CONSTRAINT "character_blood_resonance_operations_hunger_check"
      CHECK (
        "hungerSlaked" >= 1
        AND "hungerSlaked" <= 5
        AND "hungerBefore" >= 0
        AND "hungerBefore" <= 5
        AND "hungerAfter" >= 0
        AND "hungerAfter" <= 5
        AND "hungerBefore" - "hungerAfter" = "hungerSlaked"
      ),

    CONSTRAINT "character_blood_resonance_operations_profile_check"
      CHECK (
        (
          "resonanceKey" IS NULL
          AND "temperament" IS NULL
          AND "specialAffinityKey" IS NULL
        )
        OR
        (
          "resonanceKey" IS NOT NULL
          AND "temperament" IS NOT NULL
          AND "specialAffinityKey" IS NULL
        )
        OR
        (
          "sourceKind" = 'ANIMAL'
          AND "resonanceKey" IS NULL
          AND "temperament" IS NOT NULL
          AND "specialAffinityKey" = 'ANIMAL_BLOOD'
        )
        OR
        (
          "sourceKind" = 'HUMAN'
          AND "resonanceKey" IS NULL
          AND "temperament" IS NULL
          AND "specialAffinityKey" = 'RESONANCE_FREE'
        )
      )
);

CREATE INDEX
"character_blood_resonance_operations_characterId_createdAt_idx"
ON "character_blood_resonance_operations"
("characterId", "createdAt");

ALTER TABLE "character_blood_resonance_operations"
ADD CONSTRAINT
"character_blood_resonance_operations_characterId_fkey"
FOREIGN KEY ("characterId")
REFERENCES "characters"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;
