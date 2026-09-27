CREATE TABLE "chronicle_resource_audiences" (
    "bindingId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "chronicle_resource_audiences_pkey" PRIMARY KEY ("bindingId", "userId")
);

CREATE INDEX "chronicle_resource_audiences_userId_idx"
    ON "chronicle_resource_audiences"("userId");

ALTER TABLE "chronicle_resource_audiences"
    ADD CONSTRAINT "chronicle_resource_audiences_bindingId_fkey"
    FOREIGN KEY ("bindingId") REFERENCES "chronicle_resource_bindings"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "chronicle_resource_audiences"
    ADD CONSTRAINT "chronicle_resource_audiences_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
