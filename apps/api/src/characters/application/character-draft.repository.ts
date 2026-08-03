import type {
  CreateCharacterDraftData,
  PersistedCharacterDraft,
  TransitionCharacterLifecycleData,
  UpdateCharacterDraftData,
} from '../domain/persisted-character.types'

export const CHARACTER_DRAFT_REPOSITORY =
  Symbol('CHARACTER_DRAFT_REPOSITORY')

export interface CharacterDraftRepository {
  create(
    data: CreateCharacterDraftData,
  ): Promise<PersistedCharacterDraft>

  findById(
    ownerId: string,
    characterId: string,
  ): Promise<PersistedCharacterDraft | null>

  update(
    ownerId: string,
    data: UpdateCharacterDraftData,
  ): Promise<PersistedCharacterDraft>

  transitionLifecycle(
    ownerId: string,
    data: TransitionCharacterLifecycleData,
  ): Promise<PersistedCharacterDraft>
}

export class CharacterDraftWriteConflictError
  extends Error {
  constructor(characterId: string) {
    super(
      `Character draft ${characterId} was not found or has changed`,
    )
    this.name = 'CharacterDraftWriteConflictError'
  }
}

export class CharacterLifecycleWriteConflictError
  extends Error {
  constructor(characterId: string) {
    super(
      `Character ${characterId} was not found or its lifecycle has changed`,
    )
    this.name =
      'CharacterLifecycleWriteConflictError'
  }
}
