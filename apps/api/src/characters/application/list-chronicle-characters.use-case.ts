import type {
  ChronicleParticipantRepository,
} from '../../chronicles/application/chronicle-participant.repository'

import type {
  CharacterDraftRepository,
} from './character-draft.repository'

export interface ChronicleCharacterSummary {
  readonly characterId: string
  readonly ownerId: string
  readonly chronicleId: string
  readonly status:
    | 'draft'
    | 'active'
    | 'archived'
  readonly name: string
  readonly concept: string | null
  readonly updatedAt: Date
}

export class ChronicleCharacterListPermissionError
  extends Error {
  constructor() {
    super(
      'Active chronicle participation required',
    )
    this.name =
      'ChronicleCharacterListPermissionError'
  }
}

export class ListChronicleCharactersUseCase {
  constructor(
    private readonly characters:
      CharacterDraftRepository,
    private readonly participants:
      ChronicleParticipantRepository,
  ) {}

  async execute(
    requesterId: string,
    chronicleId: string,
  ): Promise<
    readonly ChronicleCharacterSummary[]
  > {
    const membership =
      await this.participants
        .findActiveMembership(
          chronicleId,
          requesterId,
        )

    if (membership === null) {
      throw new ChronicleCharacterListPermissionError()
    }

    const characters =
      await this.characters
        .listByChronicle(
          chronicleId,
        )

    return characters.map(
      (character) => ({
        characterId:
          character.characterId,
        ownerId:
          character.ownerId,
        chronicleId,
        status:
          character.status,
        name:
          character.identity.name,
        concept:
          character.identity.concept,
        updatedAt:
          character.updatedAt,
      }),
    )
  }
}
