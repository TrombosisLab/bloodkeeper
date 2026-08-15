import type {
  OffsetPage,
  OffsetPaginationQuery,
} from '../../common/offset-pagination'

import type {
  ChronicleParticipantRepository,
} from '../../chronicles/application/chronicle-participant.repository'

import type {
  CharacterDraftRepository,
} from './character-draft.repository'

import type {
  PersistedCharacterDraft,
} from '../domain/persisted-character.types'

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

function toSummary(
  character: PersistedCharacterDraft,
  chronicleId: string,
): ChronicleCharacterSummary {
  return {
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
  }
}

export class ListChronicleCharactersUseCase {
  constructor(
    private readonly characters:
      CharacterDraftRepository,
    private readonly participants:
      ChronicleParticipantRepository,
  ) {}

  execute(
    requesterId: string,
    chronicleId: string,
  ): Promise<
    readonly ChronicleCharacterSummary[]
  >

  execute(
    requesterId: string,
    chronicleId: string,
    query: OffsetPaginationQuery,
  ): Promise<
    OffsetPage<ChronicleCharacterSummary>
  >

  async execute(
    requesterId: string,
    chronicleId: string,
    query?: OffsetPaginationQuery,
  ): Promise<
    | readonly ChronicleCharacterSummary[]
    | OffsetPage<ChronicleCharacterSummary>
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

    if (query === undefined) {
      const characters =
        await this.characters
          .listByChronicle(
            chronicleId,
          )

      return characters.map(
        (character) =>
          toSummary(
            character,
            chronicleId,
          ),
      )
    }

    const page =
      await this.characters
        .listByChronicle(
          chronicleId,
          query,
        )

    return {
      items: page.items.map(
        (character) =>
          toSummary(
            character,
            chronicleId,
          ),
      ),
      nextOffset:
        page.nextOffset,
    }
  }
}
