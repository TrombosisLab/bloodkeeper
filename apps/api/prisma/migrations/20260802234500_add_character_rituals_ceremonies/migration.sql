-- CreateTable
CREATE TABLE "character_blood_sorcery_rituals" (
    "characterId" UUID NOT NULL,
    "ritualKey" TEXT NOT NULL,

    CONSTRAINT "character_blood_sorcery_rituals_pkey" PRIMARY KEY ("characterId", "ritualKey")
);

-- CreateTable
CREATE TABLE "character_oblivion_ceremonies" (
    "characterId" UUID NOT NULL,
    "ceremonyKey" TEXT NOT NULL,

    CONSTRAINT "character_oblivion_ceremonies_pkey" PRIMARY KEY ("characterId", "ceremonyKey")
);

-- AddForeignKey
ALTER TABLE "character_blood_sorcery_rituals" ADD CONSTRAINT "character_blood_sorcery_rituals_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_oblivion_ceremonies" ADD CONSTRAINT "character_oblivion_ceremonies_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
