import type {
  PersistedCharacterDraft,
  UpdateCharacterDraftData,
} from '../domain/persisted-character.types'

export interface CharacterCorrectionAuditData {
  readonly actorId: string
  readonly chronicleId: string
  readonly reason: string
}

export interface CharacterCorrectionRepository {
  correctByNarrator(
    ownerId: string,
    data: UpdateCharacterDraftData,
    audit: CharacterCorrectionAuditData,
  ): Promise<PersistedCharacterDraft>
}
