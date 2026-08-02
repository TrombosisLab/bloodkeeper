-- AlterTable
ALTER TABLE "character_humanity_states"
ADD COLUMN "stains" INTEGER NOT NULL DEFAULT 0;

-- Protect the base score and Stains as separate, coherent values.
ALTER TABLE "character_humanity_states"
ADD CONSTRAINT "character_humanity_states_value_range"
CHECK ("value" >= 0 AND "value" <= 10),
ADD CONSTRAINT "character_humanity_states_stains_range"
CHECK ("stains" >= 0 AND "stains" <= 10),
ADD CONSTRAINT "character_humanity_states_combined_limit"
CHECK ("value" + "stains" <= 10);
