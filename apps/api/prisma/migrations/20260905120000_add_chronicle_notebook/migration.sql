CREATE TYPE "ChronicleNoteVisibility" AS ENUM ('PRIVATE', 'CHRONICLE', 'SELECTED_PLAYERS');
CREATE TYPE "ChronicleNoteStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

CREATE TABLE "chronicle_notes" (
  "id" UUID NOT NULL,
  "chronicleId" UUID NOT NULL,
  "sessionId" UUID,
  "authorUserId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "visibility" "ChronicleNoteVisibility" NOT NULL DEFAULT 'CHRONICLE',
  "status" "ChronicleNoteStatus" NOT NULL DEFAULT 'ACTIVE',
  "pinned" BOOLEAN NOT NULL DEFAULT false,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "chronicle_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chronicle_note_references" (
  "id" UUID NOT NULL,
  "noteId" UUID NOT NULL,
  "targetType" TEXT NOT NULL,
  "targetId" UUID NOT NULL,
  "label" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chronicle_note_references_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chronicle_note_audiences" (
  "noteId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chronicle_note_audiences_pkey" PRIMARY KEY ("noteId", "userId")
);

CREATE UNIQUE INDEX "chronicle_note_references_unique" ON "chronicle_note_references"("noteId", "targetType", "targetId");
CREATE INDEX "chronicle_notes_chronicle_status_updated_idx" ON "chronicle_notes"("chronicleId", "status", "updatedAt");
CREATE INDEX "chronicle_notes_chronicle_session_status_idx" ON "chronicle_notes"("chronicleId", "sessionId", "status");
CREATE INDEX "chronicle_notes_author_status_idx" ON "chronicle_notes"("authorUserId", "status");
CREATE INDEX "chronicle_note_references_target_idx" ON "chronicle_note_references"("targetType", "targetId");
CREATE INDEX "chronicle_note_audiences_user_idx" ON "chronicle_note_audiences"("userId");

ALTER TABLE "chronicle_notes" ADD CONSTRAINT "chronicle_notes_chronicle_fk" FOREIGN KEY ("chronicleId") REFERENCES "chronicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chronicle_notes" ADD CONSTRAINT "chronicle_notes_session_fk" FOREIGN KEY ("sessionId") REFERENCES "chronicle_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chronicle_notes" ADD CONSTRAINT "chronicle_notes_author_fk" FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chronicle_note_references" ADD CONSTRAINT "chronicle_note_references_note_fk" FOREIGN KEY ("noteId") REFERENCES "chronicle_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chronicle_note_audiences" ADD CONSTRAINT "chronicle_note_audiences_note_fk" FOREIGN KEY ("noteId") REFERENCES "chronicle_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chronicle_note_audiences" ADD CONSTRAINT "chronicle_note_audiences_user_fk" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
