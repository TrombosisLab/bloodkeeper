CREATE TABLE "application_identity" (
    "id" INTEGER NOT NULL,
    "revision" TEXT NOT NULL,
    "icon180" BYTEA NOT NULL,
    "icon192" BYTEA NOT NULL,
    "icon512" BYTEA NOT NULL,
    "maskable" BYTEA NOT NULL,
    CONSTRAINT "application_identity_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "application_identity_singleton" CHECK ("id" = 1)
);
