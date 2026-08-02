-- CreateEnum
CREATE TYPE "AdvantageCategory" AS ENUM ('MERIT', 'BACKGROUND', 'FLAW');

-- CreateEnum
CREATE TYPE "AdvantageSelectionOrigin" AS ENUM ('CREATION', 'PREDATOR_TYPE', 'THIN_BLOOD');

-- CreateEnum
CREATE TYPE "AdvantageDetailsKind" AS ENUM ('ALLIES', 'CONTACT', 'RETAINER', 'STATUS', 'FAME', 'INFLUENCE', 'MASK', 'DARK_SECRET', 'MAWLA', 'HERD', 'RESOURCES', 'HAVEN', 'SUBSTANCE_USE', 'FOLKLORIC_BANE', 'FOLKLORIC_BLOCK', 'PREY_EXCLUSION', 'LORESHEET', 'LINGUISTICS', 'METHUSELAH_VISAGE', 'FAMOUS_FACE', 'CHILD_OF_THE_SCENE', 'ENEMY', 'STALKER', 'INFAMY', 'DESPISED', 'HATRED', 'EXILED', 'SUSPECT', 'SHUNNED', 'MORTAL_PRETENDER');

-- CreateEnum
CREATE TYPE "AdvantageMaskBenefit" AS ENUM ('ERASED', 'TAILOR');

-- CreateTable
CREATE TABLE "character_advantage_selections" (
    "characterId" UUID NOT NULL,
    "selectionId" TEXT NOT NULL,
    "definitionKey" TEXT NOT NULL,
    "category" "AdvantageCategory" NOT NULL,
    "rating" INTEGER NOT NULL,
    "origin" "AdvantageSelectionOrigin" NOT NULL,
    "parentSelectionId" TEXT,

    CONSTRAINT "character_advantage_selections_pkey" PRIMARY KEY ("characterId", "selectionId")
);

-- CreateTable
CREATE TABLE "character_advantage_details" (
    "characterId" UUID NOT NULL,
    "selectionId" TEXT NOT NULL,
    "kind" "AdvantageDetailsKind" NOT NULL,
    "effectiveness" INTEGER,
    "reliability" INTEGER,
    "identity" TEXT,
    "sphere" TEXT,
    "maskBenefits" "AdvantageMaskBenefit"[] NOT NULL DEFAULT ARRAY[]::"AdvantageMaskBenefit"[],
    "secret" TEXT,
    "resourceSource" TEXT,
    "substance" TEXT,
    "poolCategory" TEXT,
    "folkloricSource" TEXT,
    "taboo" TEXT,
    "excludedPrey" TEXT,
    "loresheetKey" TEXT,
    "benefitKey" TEXT,
    "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "resembles" TEXT,
    "subculture" TEXT,
    "description" TEXT,

    CONSTRAINT "character_advantage_details_pkey" PRIMARY KEY ("characterId", "selectionId")
);

-- CreateIndex
CREATE INDEX "character_advantage_selections_characterId_parentSelectionId_idx" ON "character_advantage_selections"("characterId", "parentSelectionId");

-- AddForeignKey
ALTER TABLE "character_advantage_selections" ADD CONSTRAINT "character_advantage_selections_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_advantage_selections" ADD CONSTRAINT "character_advantage_selections_characterId_parentSelectionId_fkey" FOREIGN KEY ("characterId", "parentSelectionId") REFERENCES "character_advantage_selections"("characterId", "selectionId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "character_advantage_details" ADD CONSTRAINT "character_advantage_details_characterId_selectionId_fkey" FOREIGN KEY ("characterId", "selectionId") REFERENCES "character_advantage_selections"("characterId", "selectionId") ON DELETE CASCADE ON UPDATE CASCADE;
