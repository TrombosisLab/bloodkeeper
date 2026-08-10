CREATE TYPE "ChronicleEventStatus" AS ENUM (
  'ACTIVE',
  'ARCHIVED'
);

CREATE TABLE "chronicle_events" (
  "id" UUID NOT NULL,
  "chronicleId" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "narratorNotes" TEXT,
  "narrativeTimeLabel" TEXT,
  "realDate" TIMESTAMPTZ(3),
  "timelineOrder" INTEGER NOT NULL,
  "status" "ChronicleEventStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "chronicle_events_pkey"
    PRIMARY KEY ("id"),

  CONSTRAINT "chronicle_events_title_not_blank"
    CHECK (length(btrim("title")) > 0)
);

CREATE INDEX "chronicle_events_chronicleId_status_idx"
  ON "chronicle_events"(
    "chronicleId",
    "status"
  );

CREATE INDEX "chronicle_events_chronicleId_timelineOrder_idx"
  ON "chronicle_events"(
    "chronicleId",
    "timelineOrder"
  );

CREATE INDEX "chronicle_events_chronicleId_realDate_idx"
  ON "chronicle_events"(
    "chronicleId",
    "realDate"
  );

ALTER TABLE "chronicle_events"
  ADD CONSTRAINT "chronicle_events_chronicleId_fkey"
  FOREIGN KEY ("chronicleId")
  REFERENCES "chronicles"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;
