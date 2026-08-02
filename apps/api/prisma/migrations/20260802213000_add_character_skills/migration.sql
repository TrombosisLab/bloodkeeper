-- CreateEnum
CREATE TYPE "SkillSpecialtyOrigin" AS ENUM ('CREATION', 'PREDATOR_TYPE');

-- CreateTable
CREATE TABLE "character_skills" (
    "characterId" UUID NOT NULL,
    "skillKey" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "character_skills_pkey" PRIMARY KEY ("characterId", "skillKey")
);

-- CreateTable
CREATE TABLE "character_skill_specialties" (
    "id" TEXT NOT NULL,
    "characterId" UUID NOT NULL,
    "skillKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "origin" "SkillSpecialtyOrigin",

    CONSTRAINT "character_skill_specialties_pkey" PRIMARY KEY ("id")
);

-- Backfill the complete skill catalogue for existing drafts.
INSERT INTO "character_skills" ("characterId", "skillKey")
SELECT "characters"."id", "skills"."skillKey"
FROM "characters"
CROSS JOIN (
    VALUES
        ('athletics'), ('brawl'), ('craft'), ('drive'),
        ('firearms'), ('larceny'), ('melee'), ('stealth'),
        ('survival'), ('animalKen'), ('etiquette'), ('insight'),
        ('intimidation'), ('leadership'), ('performance'),
        ('persuasion'), ('streetwise'), ('subterfuge'),
        ('academics'), ('awareness'), ('finance'),
        ('investigation'), ('medicine'), ('occult'),
        ('politics'), ('science'), ('technology')
) AS "skills"("skillKey");

-- CreateIndex
CREATE INDEX "character_skill_specialties_characterId_skillKey_idx" ON "character_skill_specialties"("characterId", "skillKey");

-- AddForeignKey
ALTER TABLE "character_skills" ADD CONSTRAINT "character_skills_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_skill_specialties" ADD CONSTRAINT "character_skill_specialties_characterId_skillKey_fkey" FOREIGN KEY ("characterId", "skillKey") REFERENCES "character_skills"("characterId", "skillKey") ON DELETE CASCADE ON UPDATE CASCADE;
