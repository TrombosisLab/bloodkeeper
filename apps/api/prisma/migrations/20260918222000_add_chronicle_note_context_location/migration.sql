
ALTER TABLE "chronicle_notes" ADD COLUMN "contextLocationId" UUID;
CREATE INDEX "chronicle_notes_context_location_idx" ON "chronicle_notes"("contextLocationId");
ALTER TABLE "chronicle_notes" ADD CONSTRAINT "chronicle_notes_context_location_fk" FOREIGN KEY ("contextLocationId") REFERENCES "chronicle_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
