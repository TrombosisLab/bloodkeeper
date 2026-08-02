-- CreateEnum
CREATE TYPE "CharacterStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CharacterCreationStep" AS ENUM ('IDENTITY', 'ATTRIBUTES', 'SKILLS', 'BLOOD', 'DISCIPLINES', 'ADVANTAGES', 'HUMANITY', 'REVIEW');

-- CreateEnum
CREATE TYPE "SkillDistributionMethod" AS ENUM ('GENERALIST', 'BALANCED', 'SPECIALIST');

-- CreateTable
CREATE TABLE "characters" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "chronicleId" UUID,
    "status" "CharacterStatus" NOT NULL DEFAULT 'DRAFT',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "characters_revision_check" CHECK ("revision" > 0)
);

-- CreateTable
CREATE TABLE "character_identities" (
    "id" UUID NOT NULL,
    "characterId" UUID NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "concept" TEXT,
    "predatorTypeKey" TEXT,
    "ambition" TEXT,
    "clanKey" TEXT,
    "sire" TEXT,
    "desire" TEXT,
    "generation" INTEGER,

    CONSTRAINT "character_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "character_creation_states" (
    "characterId" UUID NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "currentStep" "CharacterCreationStep" NOT NULL DEFAULT 'IDENTITY',
    "skillDistributionMethod" "SkillDistributionMethod" NOT NULL DEFAULT 'BALANCED',
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "character_creation_states_pkey" PRIMARY KEY ("characterId"),
    CONSTRAINT "character_creation_states_schemaVersion_check" CHECK ("schemaVersion" > 0)
);

-- CreateIndex
CREATE INDEX "characters_ownerId_idx" ON "characters"("ownerId");

-- CreateIndex
CREATE INDEX "characters_chronicleId_idx" ON "characters"("chronicleId");

-- CreateIndex
CREATE INDEX "characters_status_idx" ON "characters"("status");

-- CreateIndex
CREATE UNIQUE INDEX "character_identities_characterId_key" ON "character_identities"("characterId");

-- AddForeignKey
ALTER TABLE "character_identities" ADD CONSTRAINT "character_identities_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_creation_states" ADD CONSTRAINT "character_creation_states_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
