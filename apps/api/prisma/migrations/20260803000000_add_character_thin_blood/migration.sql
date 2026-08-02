-- CreateEnum
CREATE TYPE "ThinBloodAlchemyMethod" AS ENUM ('ATHANOR_CORPORIS', 'CALCINATIO', 'FIXATIO');

-- CreateTable
CREATE TABLE "character_thin_blood_alchemy_states" (
    "characterId" UUID NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 0,
    "method" "ThinBloodAlchemyMethod",

    CONSTRAINT "character_thin_blood_alchemy_states_pkey" PRIMARY KEY ("characterId")
);

-- CreateTable
CREATE TABLE "character_thin_blood_alchemy_formulas" (
    "characterId" UUID NOT NULL,
    "formulaKey" TEXT NOT NULL,

    CONSTRAINT "character_thin_blood_alchemy_formulas_pkey" PRIMARY KEY ("characterId", "formulaKey")
);

-- CreateTable
CREATE TABLE "character_thin_blood_traits" (
    "characterId" UUID NOT NULL,
    "definitionKey" TEXT NOT NULL,
    "clanCurseClanKey" TEXT,
    "disciplineAffinityDisciplineKey" TEXT,
    "disciplineAffinityPowerKey" TEXT,

    CONSTRAINT "character_thin_blood_traits_pkey" PRIMARY KEY ("characterId", "definitionKey"),
    CONSTRAINT "character_thin_blood_traits_affinity_pair_check" CHECK (("disciplineAffinityDisciplineKey" IS NULL) = ("disciplineAffinityPowerKey" IS NULL))
);

-- Preserve the empty Alchemy state of existing drafts.
INSERT INTO "character_thin_blood_alchemy_states" ("characterId")
SELECT "id" FROM "characters";

-- AddForeignKey
ALTER TABLE "character_thin_blood_alchemy_states" ADD CONSTRAINT "character_thin_blood_alchemy_states_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_thin_blood_alchemy_formulas" ADD CONSTRAINT "character_thin_blood_alchemy_formulas_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_thin_blood_traits" ADD CONSTRAINT "character_thin_blood_traits_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
