-- CreateTable
CREATE TABLE "character_damage_states" (
    "characterId" UUID NOT NULL,
    "healthSuperficial" INTEGER NOT NULL DEFAULT 0,
    "healthAggravated" INTEGER NOT NULL DEFAULT 0,
    "willpowerSuperficial" INTEGER NOT NULL DEFAULT 0,
    "willpowerAggravated" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "character_damage_states_pkey" PRIMARY KEY ("characterId"),
    CONSTRAINT "character_damage_states_health_nonnegative" CHECK ("healthSuperficial" >= 0 AND "healthAggravated" >= 0),
    CONSTRAINT "character_damage_states_willpower_nonnegative" CHECK ("willpowerSuperficial" >= 0 AND "willpowerAggravated" >= 0),
    CONSTRAINT "character_damage_states_health_limit" CHECK ("healthSuperficial" + "healthAggravated" <= 10),
    CONSTRAINT "character_damage_states_willpower_limit" CHECK ("willpowerSuperficial" + "willpowerAggravated" <= 10)
);

-- Backfill an empty damage state for existing characters.
INSERT INTO "character_damage_states" ("characterId")
SELECT "id" FROM "characters";

-- AddForeignKey
ALTER TABLE "character_damage_states" ADD CONSTRAINT "character_damage_states_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
