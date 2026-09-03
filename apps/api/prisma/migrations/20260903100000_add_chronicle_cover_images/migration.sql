CREATE TABLE "chronicle_cover_images" (
    "chronicleId" UUID NOT NULL,
    "mimeType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chronicle_cover_images_pkey" PRIMARY KEY ("chronicleId")
);

ALTER TABLE "chronicle_cover_images" ADD CONSTRAINT "chronicle_cover_images_chronicleId_fkey" FOREIGN KEY ("chronicleId") REFERENCES "chronicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
