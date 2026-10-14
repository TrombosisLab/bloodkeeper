CREATE TABLE "chronicle_backdrops" (
  "chronicleId" UUID NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "state" JSONB NOT NULL,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chronicle_backdrops_pkey" PRIMARY KEY ("chronicleId"),
  CONSTRAINT "chronicle_backdrops_chronicleId_fkey" FOREIGN KEY ("chronicleId")
    REFERENCES "chronicles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
