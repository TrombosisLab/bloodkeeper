
CREATE TABLE "library_resources" (
  "id" UUID NOT NULL, "ownerId" UUID NOT NULL, "kind" TEXT NOT NULL,
  "name" TEXT NOT NULL, "summary" TEXT, "narratorNotes" TEXT, "metadata" JSONB,
  "legacyType" TEXT, "legacyId" UUID, "status" TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "library_resources_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "library_resources_legacyType_legacyId_key" ON "library_resources"("legacyType","legacyId");
CREATE INDEX "library_resources_ownerId_kind_status_idx" ON "library_resources"("ownerId","kind","status");
CREATE TABLE "chronicle_resource_bindings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "chronicleId" UUID NOT NULL,
  "resourceId" UUID NOT NULL, "visibility" TEXT NOT NULL DEFAULT 'narrator_only',
  "chronicleNotes" TEXT, "localLabel" TEXT, "status" TEXT NOT NULL DEFAULT 'attached',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "chronicle_resource_bindings_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "chronicle_resource_bindings_chronicleId_resourceId_key" ON "chronicle_resource_bindings"("chronicleId","resourceId");
CREATE INDEX "chronicle_resource_bindings_chronicleId_status_idx" ON "chronicle_resource_bindings"("chronicleId","status");
ALTER TABLE "library_resources" ADD CONSTRAINT "library_resources_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chronicle_resource_bindings" ADD CONSTRAINT "chronicle_resource_bindings_chronicleId_fkey" FOREIGN KEY ("chronicleId") REFERENCES "chronicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "chronicle_resource_bindings" ADD CONSTRAINT "chronicle_resource_bindings_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "library_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Mantiene UUID: las imágenes y referencias heredadas siguen apuntando al mismo recurso.
INSERT INTO "library_resources" ("id","ownerId","kind","name","summary","narratorNotes","metadata","legacyType","legacyId","status","createdAt","updatedAt")
SELECT n."id",c."narratorId",'npc',n."name",n."description",n."notes",
jsonb_build_object('category',n."category",'narrativeRole',n."narrativeRole",'detailLevel',n."detailLevel",'deepProfile',n."deepProfile"),
'NPC',n."id",CASE WHEN n."status"::text='ARCHIVED' THEN 'archived' ELSE 'active' END,n."createdAt",n."updatedAt"
FROM "chronicle_npcs" n JOIN "chronicles" c ON c."id"=n."chronicleId" ON CONFLICT ("id") DO NOTHING;
INSERT INTO "library_resources" ("id","ownerId","kind","name","summary","narratorNotes","metadata","legacyType","legacyId","status","createdAt","updatedAt")
SELECT l."id",c."narratorId",'location',l."name",l."description",l."narratorNotes",
jsonb_build_object('category',l."category",'parentLocationId',l."parentLocationId"),
'LOCATION',l."id",CASE WHEN l."status"::text='ARCHIVED' THEN 'archived' ELSE 'active' END,l."createdAt",l."updatedAt"
FROM "chronicle_locations" l JOIN "chronicles" c ON c."id"=l."chronicleId" ON CONFLICT ("id") DO NOTHING;
INSERT INTO "library_resources" ("id","ownerId","kind","name","summary","narratorNotes","metadata","legacyType","legacyId","status","createdAt","updatedAt")
SELECT r."id",c."narratorId",lower(r."kind"::text),r."name",r."summary",r."narratorNotes",r."metadata",
'RESOURCE',r."id",r."status",r."createdAt",r."updatedAt"
FROM "chronicle_resources" r JOIN "chronicles" c ON c."id"=r."chronicleId" ON CONFLICT ("id") DO NOTHING;
INSERT INTO "chronicle_resource_bindings" ("chronicleId","resourceId","status","createdAt","updatedAt")
SELECT n."chronicleId",n."id",'attached',n."createdAt",n."updatedAt" FROM "chronicle_npcs" n
ON CONFLICT ("chronicleId","resourceId") DO NOTHING;
INSERT INTO "chronicle_resource_bindings" ("chronicleId","resourceId","status","createdAt","updatedAt")
SELECT l."chronicleId",l."id",'attached',l."createdAt",l."updatedAt" FROM "chronicle_locations" l
ON CONFLICT ("chronicleId","resourceId") DO NOTHING;
INSERT INTO "chronicle_resource_bindings" ("chronicleId","resourceId","visibility","status","createdAt","updatedAt")
SELECT r."chronicleId",r."id",r."visibility",'attached',r."createdAt",r."updatedAt" FROM "chronicle_resources" r
ON CONFLICT ("chronicleId","resourceId") DO NOTHING;
