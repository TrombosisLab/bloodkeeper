import type {
  CreateCharacterDraftData,
  PersistedCharacterDraft,
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
