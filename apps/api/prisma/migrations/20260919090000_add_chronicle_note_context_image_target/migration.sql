ALTER TABLE "chronicle_notes" ADD COLUMN "contextImageTargetType" TEXT;
ALTER TABLE "chronicle_notes" ADD COLUMN "contextImageTargetId" UUID;
CREATE INDEX "chronicle_notes_context_image_target_idx" ON "chronicle_notes"("contextImageTargetType", "contextImageTargetId");
