-- SPEC-058-D2: persist acquired/active Blood Dyscrasia.
-- Existing rows remain compatible because all new columns are nullable.

CREATE TYPE "CharacterBloodDyscrasiaAcquisitionMode" AS ENUM (
    'DRAIN_AND_KILL',
    'FEED_THREE_NIGHTS'
);

CREATE TYPE "CharacterBloodDyscrasiaKey" AS ENUM (
    'AGGRESSIVE',
    'CYCLE_OF_VIOLENCE',
    'ENERGETIC',
    'ENVY',
    'BULLY',
    'RIGHTEOUS',
    'VENGEFUL',
    'LOST_LOVE',
    'GRIEVING',
    'EVOCATIVE',
    'COLOSSAL_FAILURE',
    'NOSTALGIC',
    'LOST_RELATIVE',
    'COMFORTABLY_NUMB',
    'EATING_YOUR_EMOTIONS',
    'GIVEN_UP',
    'LONE_WOLF',
    'PROCRASTINATE',
    'REFLECTION',
    'RELAXED',
    'TRUE_LOVE',
    'MANIC_HIGH',
    'EXCITED',
    'ENTHUSIASTIC_ABOUT_LIFE',
    'CONTAGIOUS_ENTHUSIASM',
    'SNIFFING_GAME'
);

ALTER TABLE "character_blood_states"
ADD COLUMN "dyscrasiaKey" "CharacterBloodDyscrasiaKey",
ADD COLUMN "dyscrasiaAcquisitionMode" "CharacterBloodDyscrasiaAcquisitionMode";

ALTER TABLE "character_blood_resonance_operations"
ADD COLUMN "dyscrasiaKey" "CharacterBloodDyscrasiaKey",
ADD COLUMN "dyscrasiaAcquisitionMode" "CharacterBloodDyscrasiaAcquisitionMode";

ALTER TABLE "character_blood_states"
ADD CONSTRAINT "character_blood_states_dyscrasia_shape_check"
CHECK (
  (
    "dyscrasiaKey" IS NULL
    AND "dyscrasiaAcquisitionMode" IS NULL
  )
  OR
  (
    "dyscrasiaKey" IS NOT NULL
    AND "dyscrasiaAcquisitionMode" IS NOT NULL
    AND "resonanceKey" IS NOT NULL
    AND "resonanceTemperament" = 'ACUTE'
    AND "resonanceSpecialAffinityKey" IS NULL
    AND (
      (
        "resonanceKey" = 'CHOLERIC'
        AND "dyscrasiaKey" IN (
          'AGGRESSIVE',
          'CYCLE_OF_VIOLENCE',
          'ENERGETIC',
          'ENVY',
          'BULLY',
          'RIGHTEOUS',
          'VENGEFUL'
        )
      )
      OR
      (
        "resonanceKey" = 'MELANCHOLY'
        AND "dyscrasiaKey" IN (
          'LOST_LOVE',
          'GRIEVING',
          'EVOCATIVE',
          'COLOSSAL_FAILURE',
          'NOSTALGIC',
          'LOST_RELATIVE'
        )
      )
      OR
      (
        "resonanceKey" = 'PHLEGMATIC'
        AND "dyscrasiaKey" IN (
          'COMFORTABLY_NUMB',
          'EATING_YOUR_EMOTIONS',
          'GIVEN_UP',
          'LONE_WOLF',
          'PROCRASTINATE',
          'REFLECTION',
          'RELAXED'
        )
      )
      OR
      (
        "resonanceKey" = 'SANGUINE'
        AND "dyscrasiaKey" IN (
          'TRUE_LOVE',
          'MANIC_HIGH',
          'EXCITED',
          'ENTHUSIASTIC_ABOUT_LIFE',
          'CONTAGIOUS_ENTHUSIASM',
          'SNIFFING_GAME'
        )
      )
    )
  )
);

ALTER TABLE "character_blood_resonance_operations"
ADD CONSTRAINT "character_blood_resonance_operations_dyscrasia_shape_check"
CHECK (
  (
    "dyscrasiaKey" IS NULL
    AND "dyscrasiaAcquisitionMode" IS NULL
  )
  OR
  (
    "dyscrasiaKey" IS NOT NULL
    AND "dyscrasiaAcquisitionMode" IS NOT NULL
    AND "resonanceKey" IS NOT NULL
    AND "temperament" = 'ACUTE'
    AND "specialAffinityKey" IS NULL
    AND (
      (
        "resonanceKey" = 'CHOLERIC'
        AND "dyscrasiaKey" IN (
          'AGGRESSIVE',
          'CYCLE_OF_VIOLENCE',
          'ENERGETIC',
          'ENVY',
          'BULLY',
          'RIGHTEOUS',
          'VENGEFUL'
        )
      )
      OR
      (
        "resonanceKey" = 'MELANCHOLY'
        AND "dyscrasiaKey" IN (
          'LOST_LOVE',
          'GRIEVING',
          'EVOCATIVE',
          'COLOSSAL_FAILURE',
          'NOSTALGIC',
          'LOST_RELATIVE'
        )
      )
      OR
      (
        "resonanceKey" = 'PHLEGMATIC'
        AND "dyscrasiaKey" IN (
          'COMFORTABLY_NUMB',
          'EATING_YOUR_EMOTIONS',
          'GIVEN_UP',
          'LONE_WOLF',
          'PROCRASTINATE',
          'REFLECTION',
          'RELAXED'
        )
      )
      OR
      (
        "resonanceKey" = 'SANGUINE'
        AND "dyscrasiaKey" IN (
          'TRUE_LOVE',
          'MANIC_HIGH',
          'EXCITED',
          'ENTHUSIASTIC_ABOUT_LIFE',
          'CONTAGIOUS_ENTHUSIASM',
          'SNIFFING_GAME'
        )
      )
    )
  )
);
