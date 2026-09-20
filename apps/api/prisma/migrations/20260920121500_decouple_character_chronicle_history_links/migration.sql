-- Preserve historical story/event links when a character leaves a chronicle.
-- The links keep their original chronicleId; only the character association changes.

ALTER TABLE "chronicle_event_character_links"
  DROP CONSTRAINT IF EXISTS "chronicle_event_character_character_fkey";

ALTER TABLE "chronicle_event_character_links"
  ADD CONSTRAINT "chronicle_event_character_character_fkey"
  FOREIGN KEY ("characterId") REFERENCES "characters"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "chronicle_story_character_links"
  DROP CONSTRAINT IF EXISTS "chronicle_story_character_links_character_fkey";

ALTER TABLE "chronicle_story_character_links"
  ADD CONSTRAINT "chronicle_story_character_links_character_fkey"
  FOREIGN KEY ("characterId") REFERENCES "characters"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
