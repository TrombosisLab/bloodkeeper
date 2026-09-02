CREATE TABLE "character_portraits" (
  "characterId" UUID NOT NULL,
  "mimeType" TEXT NOT NULL,
  "byteSize" INTEGER NOT NULL,
  "sha256" TEXT NOT NULL,
  "data" BYTEA NOT NULL,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "character_portraits_pkey" PRIMARY KEY ("characterId")
);

ALTER TABLE "character_portraits"
  ADD CONSTRAINT "character_portraits_characterId_fkey"
  FOREIGN KEY ("characterId") REFERENCES "characters"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
