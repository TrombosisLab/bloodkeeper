CREATE TABLE "user_dashboard_contexts" ("userId" UUID NOT NULL, "chronicleId" UUID, "characterId" UUID, "sessionId" UUID, "lastOpenedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "user_dashboard_contexts_pkey" PRIMARY KEY ("userId"));
ALTER TABLE "user_dashboard_contexts" ADD CONSTRAINT "user_dashboard_contexts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "user_dashboard_contexts_chronicleId_idx" ON "user_dashboard_contexts"("chronicleId");
