ALTER TABLE "chronicle_resources" ADD COLUMN "location_id" UUID;
CREATE INDEX "chronicle_resources_location_id_idx" ON "chronicle_resources"("location_id");
ALTER TABLE "chronicle_resources" ADD CONSTRAINT "chronicle_resources_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "chronicle_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
