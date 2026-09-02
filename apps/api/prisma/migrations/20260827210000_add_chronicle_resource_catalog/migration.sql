CREATE TYPE "ChronicleResourceKind" AS ENUM ('DOCUMENT', 'ARTIFACT', 'ORGANIZATION');
CREATE TABLE "chronicle_resources" ("id" UUID PRIMARY KEY, "chronicleId" UUID NOT NULL REFERENCES "chronicles"("id") ON DELETE CASCADE, "kind" "ChronicleResourceKind" NOT NULL, "name" TEXT NOT NULL, "summary" TEXT, "narratorNotes" TEXT, "metadata" JSONB, "status" TEXT NOT NULL DEFAULT 'active', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL);
CREATE INDEX "chronicle_resources_chronicleId_kind_status_idx" ON "chronicle_resources"("chronicleId","kind","status");
