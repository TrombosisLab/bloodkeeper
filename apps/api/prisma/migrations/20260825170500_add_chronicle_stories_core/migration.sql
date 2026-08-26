CREATE TYPE "ChronicleExperiencePace" AS ENUM ('STANDARD', 'FAST');
CREATE TYPE "ChronicleStoryType" AS ENUM ('MAIN_ARC', 'SECONDARY_ARC', 'PERSONAL_ARC');
CREATE TYPE "ChronicleStoryVisibility" AS ENUM ('NARRATOR_ONLY', 'CHRONICLE_PARTICIPANTS');
CREATE TYPE "ChronicleStoryStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "ChronicleStoryMilestoneKey" AS ENUM ('HOOK', 'FIRST_TURN', 'REVELATION', 'CLIMAX', 'RESOLUTION');

ALTER TABLE "chronicles"
  ADD COLUMN "experiencePace" "ChronicleExperiencePace" NOT NULL DEFAULT 'STANDARD';

ALTER TABLE "chronicle_sessions"
  ADD COLUMN "experiencePaceSnapshot" "ChronicleExperiencePace";

CREATE UNIQUE INDEX "chronicle_sessions_id_chronicleId_key" ON "chronicle_sessions"("id", "chronicleId");
CREATE UNIQUE INDEX "chronicle_events_id_chronicleId_key" ON "chronicle_events"("id", "chronicleId");
CREATE UNIQUE INDEX "chronicle_npcs_id_chronicleId_key" ON "chronicle_npcs"("id", "chronicleId");
CREATE UNIQUE INDEX "chronicle_locations_id_chronicleId_key" ON "chronicle_locations"("id", "chronicleId");
CREATE UNIQUE INDEX "characters_id_chronicleId_key" ON "characters"("id", "chronicleId");

CREATE TABLE "chronicle_stories" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "chronicleId" UUID NOT NULL,
  "createdById" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "type" "ChronicleStoryType" NOT NULL DEFAULT 'MAIN_ARC',
  "premise" TEXT,
  "stakes" TEXT,
  "resolution" TEXT,
  "narratorNotes" TEXT,
  "sharedSummary" TEXT,
  "visibility" "ChronicleStoryVisibility" NOT NULL DEFAULT 'NARRATOR_ONLY',
  "status" "ChronicleStoryStatus" NOT NULL DEFAULT 'PLANNED',
  "sortOrder" INTEGER NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "startedAt" TIMESTAMPTZ(3),
  "completedAt" TIMESTAMPTZ(3),
  "archivedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "chronicle_stories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chronicle_stories_title_check" CHECK (char_length(btrim("title")) BETWEEN 1 AND 160),
  CONSTRAINT "chronicle_stories_sort_order_check" CHECK ("sortOrder" >= 0),
  CONSTRAINT "chronicle_stories_revision_check" CHECK ("revision" >= 1)
);

CREATE UNIQUE INDEX "chronicle_stories_id_chronicleId_key" ON "chronicle_stories"("id", "chronicleId");
CREATE UNIQUE INDEX "chronicle_stories_chronicleId_sortOrder_key" ON "chronicle_stories"("chronicleId", "sortOrder");
CREATE INDEX "chronicle_stories_chronicleId_status_sortOrder_idx" ON "chronicle_stories"("chronicleId", "status", "sortOrder");
CREATE INDEX "chronicle_stories_createdById_createdAt_idx" ON "chronicle_stories"("createdById", "createdAt");

CREATE TABLE "chronicle_story_milestones" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "storyId" UUID NOT NULL,
  "chronicleId" UUID NOT NULL,
  "key" "ChronicleStoryMilestoneKey" NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "note" TEXT,
  "completedAt" TIMESTAMPTZ(3),
  "completedById" UUID,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "chronicle_story_milestones_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chronicle_story_milestones_order_check" CHECK (
    ("key" = 'HOOK' AND "sortOrder" = 0) OR
    ("key" = 'FIRST_TURN' AND "sortOrder" = 1) OR
    ("key" = 'REVELATION' AND "sortOrder" = 2) OR
    ("key" = 'CLIMAX' AND "sortOrder" = 3) OR
    ("key" = 'RESOLUTION' AND "sortOrder" = 4)
  ),
  CONSTRAINT "chronicle_story_milestones_revision_check" CHECK ("revision" >= 1)
);

CREATE UNIQUE INDEX "chronicle_story_milestones_storyId_key_key" ON "chronicle_story_milestones"("storyId", "key");
CREATE UNIQUE INDEX "chronicle_story_milestones_storyId_sortOrder_key" ON "chronicle_story_milestones"("storyId", "sortOrder");
CREATE INDEX "chronicle_story_milestones_chronicleId_storyId_idx" ON "chronicle_story_milestones"("chronicleId", "storyId");
CREATE INDEX "chronicle_story_milestones_completedById_idx" ON "chronicle_story_milestones"("completedById");

CREATE TABLE "chronicle_story_reminders" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "storyId" UUID NOT NULL,
  "chronicleId" UUID NOT NULL,
  "text" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  "resolvedAt" TIMESTAMPTZ(3),
  "revision" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "chronicle_story_reminders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chronicle_story_reminders_text_check" CHECK (char_length(btrim("text")) BETWEEN 1 AND 500),
  CONSTRAINT "chronicle_story_reminders_sort_order_check" CHECK ("sortOrder" >= 0),
  CONSTRAINT "chronicle_story_reminders_revision_check" CHECK ("revision" >= 1)
);

CREATE INDEX "chronicle_story_reminders_storyId_sortOrder_idx" ON "chronicle_story_reminders"("storyId", "sortOrder");
CREATE INDEX "chronicle_story_reminders_chronicleId_storyId_idx" ON "chronicle_story_reminders"("chronicleId", "storyId");

CREATE TABLE "chronicle_story_session_links" (
  "storyId" UUID NOT NULL,
  "sessionId" UUID NOT NULL,
  "chronicleId" UUID NOT NULL,
  "progressNotes" TEXT,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chronicle_story_session_links_pkey" PRIMARY KEY ("storyId", "sessionId")
);

CREATE TABLE "chronicle_story_event_links" (
  "storyId" UUID NOT NULL,
  "eventId" UUID NOT NULL,
  "chronicleId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chronicle_story_event_links_pkey" PRIMARY KEY ("storyId", "eventId")
);

CREATE TABLE "chronicle_story_character_links" (
  "storyId" UUID NOT NULL,
  "characterId" UUID NOT NULL,
  "chronicleId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chronicle_story_character_links_pkey" PRIMARY KEY ("storyId", "characterId")
);

CREATE TABLE "chronicle_story_npc_links" (
  "storyId" UUID NOT NULL,
  "npcId" UUID NOT NULL,
  "chronicleId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chronicle_story_npc_links_pkey" PRIMARY KEY ("storyId", "npcId")
);

CREATE TABLE "chronicle_story_location_links" (
  "storyId" UUID NOT NULL,
  "locationId" UUID NOT NULL,
  "chronicleId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chronicle_story_location_links_pkey" PRIMARY KEY ("storyId", "locationId")
);

CREATE INDEX "chronicle_story_session_links_sessionId_idx" ON "chronicle_story_session_links"("sessionId");
CREATE INDEX "chronicle_story_session_links_chronicleId_storyId_idx" ON "chronicle_story_session_links"("chronicleId", "storyId");
CREATE INDEX "chronicle_story_event_links_eventId_idx" ON "chronicle_story_event_links"("eventId");
CREATE INDEX "chronicle_story_event_links_chronicleId_storyId_idx" ON "chronicle_story_event_links"("chronicleId", "storyId");
CREATE INDEX "chronicle_story_character_links_characterId_idx" ON "chronicle_story_character_links"("characterId");
CREATE INDEX "chronicle_story_character_links_chronicleId_storyId_idx" ON "chronicle_story_character_links"("chronicleId", "storyId");
CREATE INDEX "chronicle_story_npc_links_npcId_idx" ON "chronicle_story_npc_links"("npcId");
CREATE INDEX "chronicle_story_npc_links_chronicleId_storyId_idx" ON "chronicle_story_npc_links"("chronicleId", "storyId");
CREATE INDEX "chronicle_story_location_links_locationId_idx" ON "chronicle_story_location_links"("locationId");
CREATE INDEX "chronicle_story_location_links_chronicleId_storyId_idx" ON "chronicle_story_location_links"("chronicleId", "storyId");

CREATE TABLE "chronicle_story_completion_operations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "storyId" UUID NOT NULL,
  "operationId" UUID NOT NULL,
  "actorId" UUID NOT NULL,
  "eligibleCount" INTEGER NOT NULL,
  "grantedCount" INTEGER NOT NULL,
  "skippedCount" INTEGER NOT NULL,
  "completedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chronicle_story_completion_operations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "chronicle_story_completion_counts_check" CHECK (
    "eligibleCount" >= 0 AND "grantedCount" >= 0 AND "skippedCount" >= 0 AND
    "grantedCount" + "skippedCount" = "eligibleCount"
  )
);

CREATE UNIQUE INDEX "chronicle_story_completion_operations_storyId_key" ON "chronicle_story_completion_operations"("storyId");
CREATE UNIQUE INDEX "chronicle_story_completion_operations_operationId_key" ON "chronicle_story_completion_operations"("operationId");
CREATE INDEX "chronicle_story_completion_operations_actorId_completedAt_idx" ON "chronicle_story_completion_operations"("actorId", "completedAt");

ALTER TABLE "character_experience_movements" ADD COLUMN "storyId" UUID;
CREATE INDEX "character_experience_movements_storyId_idx" ON "character_experience_movements"("storyId");
CREATE UNIQUE INDEX "character_experience_movements_characterId_storyId_key" ON "character_experience_movements"("characterId", "storyId");
ALTER TABLE "character_experience_movements" ADD CONSTRAINT "character_experience_story_reason_check"
  CHECK ("storyId" IS NULL OR ("type" = 'GRANT' AND "reason" = 'story_end' AND "amount" = 1));

ALTER TABLE "chronicle_stories" ADD CONSTRAINT "chronicle_stories_chronicleId_fkey" FOREIGN KEY ("chronicleId") REFERENCES "chronicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chronicle_stories" ADD CONSTRAINT "chronicle_stories_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chronicle_story_milestones" ADD CONSTRAINT "chronicle_story_milestones_story_fkey" FOREIGN KEY ("storyId", "chronicleId") REFERENCES "chronicle_stories"("id", "chronicleId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chronicle_story_milestones" ADD CONSTRAINT "chronicle_story_milestones_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chronicle_story_reminders" ADD CONSTRAINT "chronicle_story_reminders_story_fkey" FOREIGN KEY ("storyId", "chronicleId") REFERENCES "chronicle_stories"("id", "chronicleId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chronicle_story_session_links" ADD CONSTRAINT "chronicle_story_session_links_story_fkey" FOREIGN KEY ("storyId", "chronicleId") REFERENCES "chronicle_stories"("id", "chronicleId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chronicle_story_session_links" ADD CONSTRAINT "chronicle_story_session_links_session_fkey" FOREIGN KEY ("sessionId", "chronicleId") REFERENCES "chronicle_sessions"("id", "chronicleId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chronicle_story_event_links" ADD CONSTRAINT "chronicle_story_event_links_story_fkey" FOREIGN KEY ("storyId", "chronicleId") REFERENCES "chronicle_stories"("id", "chronicleId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chronicle_story_event_links" ADD CONSTRAINT "chronicle_story_event_links_event_fkey" FOREIGN KEY ("eventId", "chronicleId") REFERENCES "chronicle_events"("id", "chronicleId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chronicle_story_character_links" ADD CONSTRAINT "chronicle_story_character_links_story_fkey" FOREIGN KEY ("storyId", "chronicleId") REFERENCES "chronicle_stories"("id", "chronicleId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chronicle_story_character_links" ADD CONSTRAINT "chronicle_story_character_links_character_fkey" FOREIGN KEY ("characterId", "chronicleId") REFERENCES "characters"("id", "chronicleId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chronicle_story_npc_links" ADD CONSTRAINT "chronicle_story_npc_links_story_fkey" FOREIGN KEY ("storyId", "chronicleId") REFERENCES "chronicle_stories"("id", "chronicleId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chronicle_story_npc_links" ADD CONSTRAINT "chronicle_story_npc_links_npc_fkey" FOREIGN KEY ("npcId", "chronicleId") REFERENCES "chronicle_npcs"("id", "chronicleId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chronicle_story_location_links" ADD CONSTRAINT "chronicle_story_location_links_story_fkey" FOREIGN KEY ("storyId", "chronicleId") REFERENCES "chronicle_stories"("id", "chronicleId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chronicle_story_location_links" ADD CONSTRAINT "chronicle_story_location_links_location_fkey" FOREIGN KEY ("locationId", "chronicleId") REFERENCES "chronicle_locations"("id", "chronicleId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chronicle_story_completion_operations" ADD CONSTRAINT "chronicle_story_completion_operations_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "chronicle_stories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chronicle_story_completion_operations" ADD CONSTRAINT "chronicle_story_completion_operations_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "character_experience_movements" ADD CONSTRAINT "character_experience_movements_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "chronicle_stories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
