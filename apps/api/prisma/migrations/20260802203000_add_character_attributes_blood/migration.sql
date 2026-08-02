-- CreateTable
CREATE TABLE "character_attributes" (
    "characterId" UUID NOT NULL,
    "strength" INTEGER NOT NULL DEFAULT 1,
    "dexterity" INTEGER NOT NULL DEFAULT 1,
    "stamina" INTEGER NOT NULL DEFAULT 1,
    "charisma" INTEGER NOT NULL DEFAULT 1,
    "manipulation" INTEGER NOT NULL DEFAULT 1,
    "composure" INTEGER NOT NULL DEFAULT 1,
    "intelligence" INTEGER NOT NULL DEFAULT 1,
    "wits" INTEGER NOT NULL DEFAULT 1,
    "resolve" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "character_attributes_pkey" PRIMARY KEY ("characterId")
);

-- CreateTable
CREATE TABLE "character_blood_states" (
    "characterId" UUID NOT NULL,
    "bloodPotency" INTEGER NOT NULL DEFAULT 1,
    "hunger" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "character_blood_states_pkey" PRIMARY KEY ("characterId")
);

-- Backfill existing drafts before enforcing relations.
INSERT INTO "character_attributes" ("characterId")
SELECT "id" FROM "characters";

INSERT INTO "character_blood_states" ("characterId")
SELECT "id" FROM "characters";

-- AddForeignKey
ALTER TABLE "character_attributes" ADD CONSTRAINT "character_attributes_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_blood_states" ADD CONSTRAINT "character_blood_states_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
