-- CreateEnum
CREATE TYPE "DisciplineOrigin" AS ENUM ('CREATION', 'PREDATOR_TYPE', 'THIN_BLOOD');

-- CreateTable
CREATE TABLE "character_disciplines" (
    "characterId" UUID NOT NULL,
    "disciplineKey" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 0,
    "origin" "DisciplineOrigin",

    CONSTRAINT "character_disciplines_pkey" PRIMARY KEY ("characterId", "disciplineKey")
);

-- CreateTable
CREATE TABLE "character_discipline_powers" (
    "characterId" UUID NOT NULL,
    "disciplineKey" TEXT NOT NULL,
    "powerKey" TEXT NOT NULL,

    CONSTRAINT "character_discipline_powers_pkey" PRIMARY KEY ("characterId", "disciplineKey", "powerKey")
);

-- AddForeignKey
ALTER TABLE "character_disciplines" ADD CONSTRAINT "character_disciplines_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_discipline_powers" ADD CONSTRAINT "character_discipline_powers_characterId_disciplineKey_fkey" FOREIGN KEY ("characterId", "disciplineKey") REFERENCES "character_disciplines"("characterId", "disciplineKey") ON DELETE CASCADE ON UPDATE CASCADE;
