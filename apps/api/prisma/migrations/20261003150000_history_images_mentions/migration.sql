ALTER TABLE "global_history_entries" ADD COLUMN "references" JSONB NOT NULL DEFAULT '[]', ADD COLUMN "imageCaption" TEXT, ADD COLUMN "imageCredit" TEXT;
CREATE TABLE "global_history_images" (
  "entryId" UUID PRIMARY KEY REFERENCES "global_history_entries"("id") ON DELETE CASCADE,
  "mimeType" TEXT NOT NULL,
  "byteSize" INTEGER NOT NULL,
  "data" BYTEA NOT NULL,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL
);
