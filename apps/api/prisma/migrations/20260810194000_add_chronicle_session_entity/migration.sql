CREATE TYPE "ChronicleSessionStatus" AS ENUM (
  'PREPARATION',
  'COMPLETED',
  'ARCHIVED'
);

CREATE TABLE "chronicle_sessions" (
  "id" UUID NOT NULL,
  "chronicleId" UUID NOT NULL,
  "sessionNumber" INTEGER,
  "title" TEXT,
  "realDate" TIMESTAMPTZ(3),
  "status" "ChronicleSessionStatus" NOT NULL DEFAULT 'PREPARATION',
  "summary" TEXT,
  "narratorNotes" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "chronicle_sessions_pkey"
    PRIMARY KEY ("id")
);

CREATE INDEX "chronicle_sessions_chronicleId_status_idx"
  ON "chronicle_sessions"("chronicleId", "status");

CREATE INDEX "chronicle_sessions_chronicleId_sessionNumber_idx"
  ON "chronicle_sessions"("chronicleId", "sessionNumber");

CREATE INDEX "chronicle_sessions_chronicleId_realDate_idx"
  ON "chronicle_sessions"("chronicleId", "realDate");

ALTER TABLE "chronicle_sessions"
  ADD CONSTRAINT "chronicle_sessions_chronicleId_fkey"
  FOREIGN KEY ("chronicleId")
  REFERENCES "chronicles"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;
