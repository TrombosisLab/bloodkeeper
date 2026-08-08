-- SPEC-021: persist explicit vampiric age category.
-- Existing characters remain unknown instead of deriving age from Generation.

CREATE TYPE "CharacterAgeCategory" AS ENUM (
    'FLEDGLING',
    'NEONATE',
    'ANCILLA',
    'ELDER'
);

ALTER TABLE "character_identities"
ADD COLUMN "ageCategory" "CharacterAgeCategory";
