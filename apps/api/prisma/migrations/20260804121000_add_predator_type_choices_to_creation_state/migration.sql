-- Preserve the explicit choices made inside Predator Type while
-- the character remains editable as a creation draft.
ALTER TABLE "character_creation_states"
ADD COLUMN "predatorTypeChoices" JSONB NOT NULL DEFAULT '{}'::jsonb;
