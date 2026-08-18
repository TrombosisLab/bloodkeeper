CREATE TABLE "chronicle_session_attendances" (
  "id" UUID NOT NULL,
  "sessionId" UUID NOT NULL,
  "characterId" UUID NOT NULL,
  "removedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "chronicle_session_attendances_pkey"
    PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "chronicle_session_attendances_sessionId_characterId_key"
  ON "chronicle_session_attendances"("sessionId", "characterId");

CREATE INDEX "chronicle_session_attendances_sessionId_idx"
  ON "chronicle_session_attendances"("sessionId");

CREATE INDEX "chronicle_session_attendances_characterId_idx"
  ON "chronicle_session_attendances"("characterId");

ALTER TABLE "chronicle_session_attendances"
  ADD CONSTRAINT "chronicle_session_attendances_sessionId_fkey"
  FOREIGN KEY ("sessionId")
  REFERENCES "chronicle_sessions"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "chronicle_session_attendances"
  ADD CONSTRAINT "chronicle_session_attendances_characterId_fkey"
  FOREIGN KEY ("characterId")
  REFERENCES "characters"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;
