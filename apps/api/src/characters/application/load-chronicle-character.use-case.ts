import type {
  ChronicleParticipantRepository,
} from '../../chronicles/application/chronicle-participant.repository'

import type {
  CharacterDraftRepository,
} from './character-draft.repository'

import type {
  PersistedCharacterDraft,
} from '../domain/persisted-character.types'

export class ChronicleCharacterReadPermissionError
  extends Error {
  constructor() {
    super(
      'Narrator participation is required to read another player character',
    )
    this.name =
      'ChronicleCharacterReadPermissionError'
  }
}

export class ChronicleCharacterNotFoundError
  extends Error {
  constructor(characterId: string) {
    super(
      `Character ${characterId} is not associated with the chronicle`,
    )
    this.name =
      'ChronicleCharacterNotFoundError'
  }
}

export class LoadChronicleCharacterUseCase {
  constructor(
    private readonly characters:
      CharacterDraftRepository,
    private readonly participants:
      ChronicleParticipantRepository,
  ) {}

  async execute(
    requesterId: string,
    chronicleId: string,
    characterId: string,
  ): Promise<PersistedCharacterDraft> {
    const membership =
      await this.participants.findActiveMembership(
        chronicleId,
        requesterId,
      )

    if (
      membership === null ||
      membership.role !== 'narrator'
    ) {
      throw new ChronicleCharacterReadPermissionError()
    }

    const character =
      await this.characters.findByCharacterId(
        characterId,
      )

    if (
      character === null ||
      character.chronicleId !== chronicleId
    ) {
      throw new ChronicleCharacterNotFoundError(
        characterId,
      )
    }

    return character
  }
}
