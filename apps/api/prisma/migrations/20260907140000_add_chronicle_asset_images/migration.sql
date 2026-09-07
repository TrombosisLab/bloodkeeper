CREATE TABLE "chronicle_asset_images" (
  "assetType" TEXT NOT NULL,
  "entityId" UUID NOT NULL,
  "mimeType" TEXT NOT NULL,
  "byteSize" INTEGER NOT NULL,
  "sha256" TEXT NOT NULL,
  "data" BYTEA NOT NULL,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chronicle_asset_images_pkey" PRIMARY KEY ("assetType", "entityId")
);
CREATE INDEX "chronicle_asset_images_entityId_idx" ON "chronicle_asset_images"("entityId");
