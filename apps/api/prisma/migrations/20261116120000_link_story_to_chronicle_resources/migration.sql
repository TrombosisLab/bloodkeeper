CREATE TABLE "chronicle_story_resource_links" (
    "storyId" UUID NOT NULL,
    "chronicleId" UUID NOT NULL,
    "resourceId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chronicle_story_resource_links_pkey" PRIMARY KEY ("storyId", "resourceId")
);

CREATE INDEX "chronicle_story_resource_links_chronicleId_storyId_idx"
    ON "chronicle_story_resource_links"("chronicleId", "storyId");
CREATE INDEX "chronicle_story_resource_links_resourceId_idx"
    ON "chronicle_story_resource_links"("resourceId");

ALTER TABLE "chronicle_story_resource_links"
    ADD CONSTRAINT "chronicle_story_resource_links_storyId_chronicleId_fkey"
    FOREIGN KEY ("storyId", "chronicleId")
    REFERENCES "chronicle_stories"("id", "chronicleId")
    ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "chronicle_story_resource_links"
    ADD CONSTRAINT "chronicle_story_resource_links_resourceId_fkey"
    FOREIGN KEY ("resourceId")
    REFERENCES "library_resources"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
