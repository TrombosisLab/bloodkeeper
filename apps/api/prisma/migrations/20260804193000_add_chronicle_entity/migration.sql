-- CreateEnum
CREATE TYPE "ChronicleStatus" AS ENUM (
    'PREPARATION',
    'ACTIVE',
    'ARCHIVED'
);

-- CreateTable
CREATE TABLE "chronicles" (
    "id" UUID NOT NULL,
    "narratorId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ChronicleStatus" NOT NULL
        DEFAULT 'PREPARATION',
    "createdAt" TIMESTAMPTZ(3) NOT NULL
        DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "chronicles_pkey"
        PRIMARY KEY ("id"),
    CONSTRAINT "chronicles_name_not_blank"
        CHECK (length(btrim("name")) > 0)
);

-- CreateIndex
CREATE INDEX "chronicles_narratorId_idx"
    ON "chronicles"("narratorId");

-- CreateIndex
CREATE INDEX "chronicles_status_idx"
    ON "chronicles"("status");
