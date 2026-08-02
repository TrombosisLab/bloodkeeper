-- CreateTable
CREATE TABLE "character_humanity_states" (
    "characterId" UUID NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 7,

    CONSTRAINT "character_humanity_states_pkey" PRIMARY KEY ("characterId")
);

-- CreateTable
CREATE TABLE "character_touchstones" (
    "characterId" UUID NOT NULL,
    "touchstoneId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,

    CONSTRAINT "character_touchstones_pkey" PRIMARY KEY ("characterId", "touchstoneId")
);

-- CreateTable
CREATE TABLE "character_convictions" (
    "characterId" UUID NOT NULL,
    "convictionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "touchstoneId" TEXT,

    CONSTRAINT "character_convictions_pkey" PRIMARY KEY ("characterId", "convictionId")
);

-- Backfill the default Humanity state for existing drafts.
INSERT INTO "character_humanity_states" ("characterId")
SELECT "id" FROM "characters";

-- CreateIndex
CREATE INDEX "character_convictions_characterId_touchstoneId_idx" ON "character_convictions"("characterId", "touchstoneId");

-- AddForeignKey
ALTER TABLE "character_humanity_states" ADD CONSTRAINT "character_humanity_states_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_touchstones" ADD CONSTRAINT "character_touchstones_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_convictions" ADD CONSTRAINT "character_convictions_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "characters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "character_convictions" ADD CONSTRAINT "character_convictions_characterId_touchstoneId_fkey" FOREIGN KEY ("characterId", "touchstoneId") REFERENCES "character_touchstones"("characterId", "touchstoneId") ON DELETE RESTRICT ON UPDATE CASCADE;
