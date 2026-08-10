-- SPEC-033.A: Localización narrativa persistida dentro de una Crónica.

CREATE TYPE "ChronicleLocationStatus" AS ENUM (
  'ACTIVE',
  'ARCHIVED'
);

CREATE TABLE "chronicle_locations" (
  "id" UUID NOT NULL,
  "chronicleId" UUID NOT NULL,
  "parentLocationId" UUID,
  "name" TEXT NOT NULL,
  "category" TEXT,
  "description" TEXT,
  "narratorNotes" TEXT,
  "status" "ChronicleLocationStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,

  CONSTRAINT "chronicle_locations_pkey"
    PRIMARY KEY ("id"),

  CONSTRAINT "chronicle_locations_name_not_blank"
    CHECK (length(btrim("name")) > 0)
);

CREATE INDEX "chronicle_locations_chronicleId_status_idx"
  ON "chronicle_locations"("chronicleId", "status");

CREATE INDEX "chronicle_locations_chronicleId_parentLocationId_idx"
  ON "chronicle_locations"("chronicleId", "parentLocationId");

CREATE INDEX "chronicle_locations_parentLocationId_idx"
  ON "chronicle_locations"("parentLocationId");

ALTER TABLE "chronicle_locations"
  ADD CONSTRAINT "chronicle_locations_chronicleId_fkey"
  FOREIGN KEY ("chronicleId")
  REFERENCES "chronicles"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;

ALTER TABLE "chronicle_locations"
  ADD CONSTRAINT "chronicle_locations_parentLocationId_fkey"
  FOREIGN KEY ("parentLocationId")
  REFERENCES "chronicle_locations"("id")
  ON DELETE RESTRICT
  ON UPDATE CASCADE;
