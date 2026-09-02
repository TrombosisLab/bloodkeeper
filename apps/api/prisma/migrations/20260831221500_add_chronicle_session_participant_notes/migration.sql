CREATE TABLE "chronicle_session_participant_notes" (
    "id" UUID NOT NULL,
    "chronicleId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "authorUserId" UUID NOT NULL,
    "privateNotes" TEXT,
    "publicNotes" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "chronicle_session_participant_notes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "chronicle_session_participant_notes_sessionId_authorUserId_key"
ON "chronicle_session_participant_notes"("sessionId", "authorUserId");

CREATE INDEX "chronicle_session_participant_notes_chronicleId_sessionId_idx"
ON "chronicle_session_participant_notes"("chronicleId", "sessionId");

CREATE INDEX "chronicle_session_participant_notes_authorUserId_idx"
ON "chronicle_session_participant_notes"("authorUserId");

ALTER TABLE "chronicle_session_participant_notes"
ADD CONSTRAINT "chronicle_session_participant_notes_chronicleId_fkey"
FOREIGN KEY ("chronicleId") REFERENCES "chronicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "chronicle_session_participant_notes"
ADD CONSTRAINT "chronicle_session_participant_notes_sessionId_chronicleId_fkey"
FOREIGN KEY ("sessionId", "chronicleId") REFERENCES "chronicle_sessions"("id", "chronicleId") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chronicle_session_participant_notes"
ADD CONSTRAINT "chronicle_session_participant_notes_authorUserId_fkey"
FOREIGN KEY ("authorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
