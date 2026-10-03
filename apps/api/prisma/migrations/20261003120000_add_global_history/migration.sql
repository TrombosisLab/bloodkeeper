CREATE TYPE "GlobalHistoryEntryStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TYPE "GlobalHistoryEntryVisibility" AS ENUM ('ALL_USERS', 'NARRATORS_ONLY', 'PRIVATE');

CREATE TABLE "global_history_entries" (
    "id" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "periodLabel" TEXT,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "category" TEXT NOT NULL DEFAULT 'event',
    "summary" TEXT,
    "content" TEXT NOT NULL DEFAULT '',
    "sourceKind" TEXT NOT NULL DEFAULT 'custom',
    "visibility" "GlobalHistoryEntryVisibility" NOT NULL DEFAULT 'ALL_USERS',
    "status" "GlobalHistoryEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "global_history_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "global_history_entry_chronicles" (
    "entryId" UUID NOT NULL,
    "chronicleId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "global_history_entry_chronicles_pkey" PRIMARY KEY ("entryId", "chronicleId")
);

CREATE INDEX "global_history_entries_status_visibility_startYear_idx"
    ON "global_history_entries"("status", "visibility", "startYear");

CREATE INDEX "global_history_entries_authorId_status_idx"
    ON "global_history_entries"("authorId", "status");

CREATE INDEX "global_history_entries_category_status_idx"
    ON "global_history_entries"("category", "status");

CREATE INDEX "global_history_entry_chronicles_chronicleId_idx"
    ON "global_history_entry_chronicles"("chronicleId");

ALTER TABLE "global_history_entries"
    ADD CONSTRAINT "global_history_entries_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "global_history_entry_chronicles"
    ADD CONSTRAINT "global_history_entry_chronicles_entryId_fkey"
    FOREIGN KEY ("entryId") REFERENCES "global_history_entries"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "global_history_entry_chronicles"
    ADD CONSTRAINT "global_history_entry_chronicles_chronicleId_fkey"
    FOREIGN KEY ("chronicleId") REFERENCES "chronicles"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
