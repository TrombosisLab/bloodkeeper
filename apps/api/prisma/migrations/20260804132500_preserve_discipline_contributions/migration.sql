-- Preserve separate Discipline contributions such as
-- creation + Predator Type for the same Discipline key.

ALTER TABLE "character_discipline_powers"
DROP CONSTRAINT "character_discipline_powers_characterId_disciplineKey_fkey";

ALTER TABLE "character_disciplines"
ADD COLUMN "contributionKey" TEXT;

UPDATE "character_disciplines"
SET "contributionKey" = CASE
  WHEN "origin" = 'CREATION' THEN 'creation'
  WHEN "origin" = 'PREDATOR_TYPE' THEN 'predatorType'
  WHEN "origin" = 'THIN_BLOOD' THEN 'thinBlood'
  ELSE 'unspecified'
END;

ALTER TABLE "character_disciplines"
ALTER COLUMN "contributionKey" SET NOT NULL;

ALTER TABLE "character_discipline_powers"
ADD COLUMN "contributionKey" TEXT;

UPDATE "character_discipline_powers" AS power
SET "contributionKey" = discipline."contributionKey"
FROM "character_disciplines" AS discipline
WHERE
  power."characterId" = discipline."characterId"
  AND power."disciplineKey" = discipline."disciplineKey";

ALTER TABLE "character_discipline_powers"
ALTER COLUMN "contributionKey" SET NOT NULL;

ALTER TABLE "character_discipline_powers"
DROP CONSTRAINT "character_discipline_powers_pkey";

ALTER TABLE "character_disciplines"
DROP CONSTRAINT "character_disciplines_pkey";

ALTER TABLE "character_disciplines"
ADD CONSTRAINT "character_disciplines_pkey"
PRIMARY KEY (
  "characterId",
  "disciplineKey",
  "contributionKey"
);

ALTER TABLE "character_discipline_powers"
ADD CONSTRAINT "character_discipline_powers_pkey"
PRIMARY KEY (
  "characterId",
  "disciplineKey",
  "contributionKey",
  "powerKey"
);

ALTER TABLE "character_discipline_powers"
ADD CONSTRAINT "character_discipline_powers_characterId_disciplineKey_contributionKey_fkey"
FOREIGN KEY (
  "characterId",
  "disciplineKey",
  "contributionKey"
)
REFERENCES "character_disciplines"(
  "characterId",
  "disciplineKey",
  "contributionKey"
)
ON DELETE CASCADE
ON UPDATE CASCADE;
