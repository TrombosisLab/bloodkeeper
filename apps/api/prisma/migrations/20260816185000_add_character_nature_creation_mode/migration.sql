-- SPEC-057-A: add character nature and creation mode without changing existing identities or mechanics.

CREATE TYPE "CharacterNature" AS ENUM (
    'HUMAN',
    'VAMPIRE'
);

CREATE TYPE "CharacterCreationMode" AS ENUM (
    'STANDARD',
    'SESSION_ZERO'
);

ALTER TABLE "characters"
ADD COLUMN "nature" "CharacterNature" NOT NULL
DEFAULT 'VAMPIRE';

ALTER TABLE "character_creation_states"
ADD COLUMN "creationMode" "CharacterCreationMode" NOT NULL
DEFAULT 'STANDARD';
