BEGIN;
CREATE TABLE "chronicle_note_favorites" (
  "noteId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chronicle_note_favorites_pkey" PRIMARY KEY ("noteId", "userId"),
  CONSTRAINT "chronicle_note_favorites_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "chronicle_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "chronicle_note_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "chronicle_note_favorites_userId_idx" ON "chronicle_note_favorites"("userId");
-- Preserve existing pins as personal favorites of each note's author.
INSERT INTO "chronicle_note_favorites" ("noteId", "userId")
SELECT "id", "authorUserId" FROM "chronicle_notes" WHERE "pinned" = TRUE
ON CONFLICT DO NOTHING;
COMMIT;
