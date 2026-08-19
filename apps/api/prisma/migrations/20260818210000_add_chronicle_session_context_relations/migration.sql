CREATE TABLE "chronicle_session_event_links" (
  "sessionId" UUID NOT NULL,
  "eventId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "chronicle_session_event_links_pkey"
    PRIMARY KEY ("sessionId", "eventId")
);

CREATE INDEX "chronicle_session_event_links_eventId_idx"
  ON "chronicle_session_event_links"("eventId");

ALTER TABLE "chronicle_session_event_links"
  ADD CONSTRAINT "chronicle_session_event_links_sessionId_fkey"
  FOREIGN KEY ("sessionId")
  REFERENCES "chronicle_sessions"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "chronicle_session_event_links"
  ADD CONSTRAINT "chronicle_session_event_links_eventId_fkey"
  FOREIGN KEY ("eventId")
  REFERENCES "chronicle_events"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;


CREATE TABLE "chronicle_session_npc_links" (
  "sessionId" UUID NOT NULL,
  "npcId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "chronicle_session_npc_links_pkey"
    PRIMARY KEY ("sessionId", "npcId")
);

CREATE INDEX "chronicle_session_npc_links_npcId_idx"
  ON "chronicle_session_npc_links"("npcId");

ALTER TABLE "chronicle_session_npc_links"
  ADD CONSTRAINT "chronicle_session_npc_links_sessionId_fkey"
  FOREIGN KEY ("sessionId")
  REFERENCES "chronicle_sessions"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "chronicle_session_npc_links"
  ADD CONSTRAINT "chronicle_session_npc_links_npcId_fkey"
  FOREIGN KEY ("npcId")
  REFERENCES "chronicle_npcs"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;


CREATE TABLE "chronicle_session_location_links" (
  "sessionId" UUID NOT NULL,
  "locationId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "chronicle_session_location_links_pkey"
    PRIMARY KEY ("sessionId", "locationId")
);

CREATE INDEX "chronicle_session_location_links_locationId_idx"
  ON "chronicle_session_location_links"("locationId");

ALTER TABLE "chronicle_session_location_links"
  ADD CONSTRAINT "chronicle_session_location_links_sessionId_fkey"
  FOREIGN KEY ("sessionId")
  REFERENCES "chronicle_sessions"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "chronicle_session_location_links"
  ADD CONSTRAINT "chronicle_session_location_links_locationId_fkey"
  FOREIGN KEY ("locationId")
  REFERENCES "chronicle_locations"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;
