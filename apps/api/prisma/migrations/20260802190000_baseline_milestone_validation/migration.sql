-- Baseline of the infrastructure table that predates Prisma migrations.
CREATE TABLE "milestone_validation" (
    "id" INTEGER NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "milestone_validation_pkey" PRIMARY KEY ("id")
);
