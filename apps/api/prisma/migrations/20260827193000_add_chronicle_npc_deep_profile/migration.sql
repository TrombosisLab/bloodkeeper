ALTER TYPE "ChronicleNpcDetailLevel" ADD VALUE IF NOT EXISTS 'DEEP';
ALTER TABLE "chronicle_npcs" ADD COLUMN IF NOT EXISTS "deepProfile" JSONB;
