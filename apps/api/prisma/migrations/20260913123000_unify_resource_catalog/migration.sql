-- Unifica los vínculos de sesiones con el recurso global canónico.
-- La migración global anterior conserva los UUID de ChronicleResource.

INSERT INTO "library_resources" ("id","ownerId","kind","name","summary","narratorNotes","metadata","legacyType","legacyId","status","createdAt","updatedAt")
SELECT r."id", c."narratorId", lower(r."kind"::text), r."name", r."summary", r."narratorNotes", r."metadata", 'RESOURCE', r."id", r."status", r."createdAt", r."updatedAt"
FROM "chronicle_resources" r
JOIN "chronicles" c ON c."id" = r."chronicleId"
WHERE NOT EXISTS (SELECT 1 FROM "library_resources" lr WHERE lr."id" = r."id");

INSERT INTO "chronicle_resource_bindings" ("chronicleId","resourceId","visibility","status","createdAt","updatedAt")
SELECT r."chronicleId", r."id", r."visibility", CASE WHEN r."status" = 'archived' THEN 'archived' ELSE 'attached' END, r."createdAt", r."updatedAt"
FROM "chronicle_resources" r
ON CONFLICT ("chronicleId","resourceId") DO NOTHING;

ALTER TABLE "chronicle_session_resource_links"
  DROP CONSTRAINT IF EXISTS "chronicle_session_resource_links_resourceId_fkey";

ALTER TABLE "chronicle_session_resource_links"
  ADD CONSTRAINT "chronicle_session_resource_links_resourceId_fkey"
  FOREIGN KEY ("resourceId") REFERENCES "library_resources"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
