CREATE TABLE "chronicle_relationship_maps" (
  "chronicleId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "privateMap" JSONB NOT NULL,
  "sharedMap" JSONB NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "chronicle_relationship_maps_pkey" PRIMARY KEY ("chronicleId", "userId"),
  CONSTRAINT "chronicle_relationship_maps_chronicleId_fkey" FOREIGN KEY ("chronicleId") REFERENCES "chronicles"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "chronicle_relationship_maps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
