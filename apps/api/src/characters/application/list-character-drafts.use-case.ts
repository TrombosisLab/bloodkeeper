import type {
  OffsetPage,
  OffsetPaginationQuery,
} from '../../common/offset-pagination'

import type {
  CharacterDraftRepository,
} from './character-draft.repository'

import type {
  PersistedCharacterDraft,
} from '../domain/persisted-character.types'

export class ListCharacterDraftsUseCase {
  constructor(
    private readonly repository:
      CharacterDraftRepository,
  ) {}

  execute(
    ownerId: string,
  ): Promise<
    readonly PersistedCharacterDraft[]
  >

  execute(
    ownerId: string,
    query: OffsetPaginationQuery,
  ): Promise<
    OffsetPage<PersistedCharacterDraft>
  >

  execute(
    ownerId: string,
    query?: OffsetPaginationQuery,
  ): Promise<
    | readonly PersistedCharacterDraft[]
    | OffsetPage<PersistedCharacterDraft>
  > {
    return query === undefined
      ? this.repository.listByOwner(
          ownerId,
        )
      : this.repository.listByOwner(
          ownerId,
          query,
        )
  }
}
