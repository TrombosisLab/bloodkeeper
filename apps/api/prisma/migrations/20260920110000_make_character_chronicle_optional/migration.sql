-- Allow a character to remain owned by its player without being attached to a chronicle.
-- Existing character rows and all their history are preserved.
ALTER TABLE "characters"
  ALTER COLUMN "chronicleId" DROP NOT NULL;
