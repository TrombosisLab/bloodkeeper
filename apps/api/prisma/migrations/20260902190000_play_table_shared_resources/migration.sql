ALTER TABLE "chronicle_resources"
  ADD COLUMN "visibility" TEXT NOT NULL DEFAULT 'narrator_only';

CREATE INDEX "chronicle_resources_chronicleId_visibility_status_idx"
  ON "chronicle_resources"("chronicleId", "visibility", "status");

CREATE TABLE "chronicle_session_resource_links" (
  "sessionId" UUID NOT NULL,
  "resourceId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chronicle_session_resource_links_pkey" PRIMARY KEY ("sessionId", "resourceId")
);

CREATE INDEX "chronicle_session_resource_links_resourceId_idx"
  ON "chronicle_session_resource_links"("resourceId");

ALTER TABLE "chronicle_session_resource_links"
  ADD CONSTRAINT "chronicle_session_resource_links_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "chronicle_sessions"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "chronicle_session_resource_links"
  ADD CONSTRAINT "chronicle_session_resource_links_resourceId_fkey"
  FOREIGN KEY ("resourceId") REFERENCES "chronicle_resources"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
