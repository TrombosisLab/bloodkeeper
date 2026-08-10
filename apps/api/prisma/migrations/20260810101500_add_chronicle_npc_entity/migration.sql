-- SPEC-032.A: PNJ simple persistido dentro de una Crónica.

CREATE TYPE "ChronicleNpcStatus" AS ENUM (
  'ACTIVE',
  'ARCHIVED'
);

CREATE TYPE "ChronicleNpcDetailLevel" AS ENUM (
  'SIMPLE'
);

CREATE TABLE "chronicle_npcs" (
  "id" UUID NOT NULL,
  "chronicleId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT,
  "description" TEXT,
  "narrativeRole" TEXT,
  "notes" TEXT,
  "status" "ChronicleNpcStatus" NOT NULL DEFAULT 'ACTIVE',
  "detailLevel" "ChronicleNpcDetailLevel" NOT NULL DEFAULT 'SIMPLE',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "chronicle_npcs_pkey"
    PRIMARY KEY ("id"),

  CONSTRAINT "chronicle_npcs_name_not_blank"
    CHECK (length(btrim("name")) > 0)
);

CREATE INDEX "chronicle_npcs_chronicleId_status_idx"
  ON "chronicle_npcs"("chronicleId", "status");

CREATE INDEX "chronicle_npcs_chronicleId_detailLevel_idx"
  ON "chronicle_npcs"("chronicleId", "detailLevel");

ALTER TABLE "chronicle_npcs"
  ADD CONSTRAINT "chronicle_npcs_chronicleId_fkey"
  FOREIGN KEY ("chronicleId")
  REFERENCES "chronicles"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;
