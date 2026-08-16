import type {
  PersistedCharacterBlood,
  PersistedCharacterDraft,
  PersistedCharacterThinBloodAlchemy,
} from './persisted-character.types'

export class CharacterVampireStateUnavailableError
  extends Error {
  readonly characterId: string
  readonly component:
    | 'blood'
    | 'thinBloodAlchemy'

  constructor(
    characterId: string,
    component:
      | 'blood'
      | 'thinBloodAlchemy',
  ) {
    super(
      `Character ${characterId} has no ${component} state`,
    )
    this.name =
      'CharacterVampireStateUnavailableError'
    this.characterId = characterId
    this.component = component
  }
}

export function requireCharacterBlood(
  character: Pick<
    PersistedCharacterDraft,
    'characterId' | 'blood'
  >,
): PersistedCharacterBlood {
  if (character.blood === null) {
    throw new CharacterVampireStateUnavailableError(
      character.characterId,
      'blood',
    )
  }

  return character.blood
}

export function requireCharacterThinBloodAlchemy(
  character: Pick<
    PersistedCharacterDraft,
    'characterId' | 'thinBloodAlchemy'
  >,
): PersistedCharacterThinBloodAlchemy {
  if (character.thinBloodAlchemy === null) {
    throw new CharacterVampireStateUnavailableError(
      character.characterId,
      'thinBloodAlchemy',
    )
  }

  return character.thinBloodAlchemy
}
