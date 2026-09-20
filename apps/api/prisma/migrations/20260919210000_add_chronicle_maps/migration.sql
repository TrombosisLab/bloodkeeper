CREATE TYPE "ChronicleMapStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

CREATE TYPE "ChronicleMapRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "chronicle_maps" (
    "id" UUID NOT NULL,
    "chronicleId" UUID NOT NULL,
    "parentMapId" UUID,
    "linkedLocationId" UUID,
    "linkedResourceId" UUID,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ChronicleMapStatus" NOT NULL DEFAULT 'ACTIVE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "chronicle_maps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chronicle_map_markers" (
    "id" UUID NOT NULL,
    "mapId" UUID NOT NULL,
    "resourceId" UUID,
    "locationId" UUID,
    "kind" TEXT NOT NULL DEFAULT 'LOCATION',
    "label" TEXT,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'chronicle_participants',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "chronicle_map_markers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chronicle_map_areas" (
    "id" UUID NOT NULL,
    "mapId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "geometry" JSONB NOT NULL,
    "color" TEXT,
    "visibility" TEXT NOT NULL DEFAULT 'chronicle_participants',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "chronicle_map_areas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chronicle_map_requests" (
    "id" UUID NOT NULL,
    "mapId" UUID NOT NULL,
    "requesterId" UUID NOT NULL,
    "resourceId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'LOCATION',
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "status" "ChronicleMapRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "chronicle_map_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "chronicle_maps_chronicleId_status_parentMapId_idx" ON "chronicle_maps"("chronicleId", "status", "parentMapId");
CREATE INDEX "chronicle_maps_parentMapId_idx" ON "chronicle_maps"("parentMapId");
CREATE INDEX "chronicle_maps_linkedLocationId_idx" ON "chronicle_maps"("linkedLocationId");
CREATE INDEX "chronicle_maps_linkedResourceId_idx" ON "chronicle_maps"("linkedResourceId");
CREATE INDEX "chronicle_map_markers_mapId_idx" ON "chronicle_map_markers"("mapId");
CREATE INDEX "chronicle_map_markers_resourceId_idx" ON "chronicle_map_markers"("resourceId");
CREATE INDEX "chronicle_map_markers_locationId_idx" ON "chronicle_map_markers"("locationId");
CREATE INDEX "chronicle_map_areas_mapId_idx" ON "chronicle_map_areas"("mapId");
CREATE INDEX "chronicle_map_requests_mapId_status_idx" ON "chronicle_map_requests"("mapId", "status");
CREATE INDEX "chronicle_map_requests_requesterId_status_idx" ON "chronicle_map_requests"("requesterId", "status");

ALTER TABLE "chronicle_maps" ADD CONSTRAINT "chronicle_maps_chronicleId_fkey" FOREIGN KEY ("chronicleId") REFERENCES "chronicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chronicle_maps" ADD CONSTRAINT "chronicle_maps_parentMapId_fkey" FOREIGN KEY ("parentMapId") REFERENCES "chronicle_maps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chronicle_maps" ADD CONSTRAINT "chronicle_maps_linkedLocationId_fkey" FOREIGN KEY ("linkedLocationId") REFERENCES "chronicle_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chronicle_maps" ADD CONSTRAINT "chronicle_maps_linkedResourceId_fkey" FOREIGN KEY ("linkedResourceId") REFERENCES "library_resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "chronicle_map_markers" ADD CONSTRAINT "chronicle_map_markers_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "chronicle_maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chronicle_map_markers" ADD CONSTRAINT "chronicle_map_markers_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "library_resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "chronicle_map_markers" ADD CONSTRAINT "chronicle_map_markers_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "chronicle_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "chronicle_map_areas" ADD CONSTRAINT "chronicle_map_areas_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "chronicle_maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chronicle_map_requests" ADD CONSTRAINT "chronicle_map_requests_mapId_fkey" FOREIGN KEY ("mapId") REFERENCES "chronicle_maps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chronicle_map_requests" ADD CONSTRAINT "chronicle_map_requests_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chronicle_map_requests" ADD CONSTRAINT "chronicle_map_requests_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "library_resources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
