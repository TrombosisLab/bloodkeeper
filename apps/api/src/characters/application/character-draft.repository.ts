import type {
  OffsetPage,
  OffsetPaginationQuery,
} from '../../common/offset-pagination'

import type {
  UpdateCharacterStateData,
} from '../domain/character-state.types'

import type {
  PersistCharacterEmbraceData,
} from '../domain/character-embrace.types'

import type {
  PersistInitialVampireProfileConsolidationData,
  PersistInitialVampireResolutionData,
} from '../domain/character-initial-vampire-resolution.types'

import type {
  CreateCharacterDraftData,
  PersistedCharacterDraft,
  TransitionCharacterLifecycleData,
  UpdateCharacterChronicleAssociationData,
  UpdateCharacterDraftData,
} from '../domain/persisted-character.types'

export const CHARACTER_DRAFT_REPOSITORY =
  Symbol('CHARACTER_DRAFT_REPOSITORY')

export interface CharacterDraftRepository {
  create(
    data: CreateCharacterDraftData,
  ): Promise<PersistedCharacterDraft>

  listByOwner(
    ownerId: string,
  ): Promise<readonly PersistedCharacterDraft[]>

  listByOwner(
    ownerId: string,
    query: OffsetPaginationQuery,
  ): Promise<
    OffsetPage<PersistedCharacterDraft>
  >

  listByChronicle(
    chronicleId: string,
  ): Promise<readonly PersistedCharacterDraft[]>

  listByChronicle(
    chronicleId: string,
    query: OffsetPaginationQuery,
  ): Promise<OffsetPage<PersistedCharacterDraft>>

  findById(
    ownerId: string,
    characterId: string,
  ): Promise<PersistedCharacterDraft | null>

  findByCharacterId(
    characterId: string,
  ): Promise<PersistedCharacterDraft | null>

  update(
    ownerId: string,
    data: UpdateCharacterDraftData,
  ): Promise<PersistedCharacterDraft>

  hasHistoryEntries(
    ownerId: string,
    characterId: string,
  ): Promise<boolean>

  updateChronicleAssociation(
    ownerId: string,
    data: UpdateCharacterChronicleAssociationData,
  ): Promise<PersistedCharacterDraft>

  updateState(
    ownerId: string,
    data: UpdateCharacterStateData,
  ): Promise<PersistedCharacterDraft>

  embrace(
    data: PersistCharacterEmbraceData,
  ): Promise<PersistedCharacterDraft>

  resolveInitialVampireState(
    data: PersistInitialVampireResolutionData,
  ): Promise<PersistedCharacterDraft>

  consolidateInitialVampireProfile(
    data:
      PersistInitialVampireProfileConsolidationData,
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

export class CharacterStateWriteConflictError
  extends Error {
  constructor(characterId: string) {
    super(
      `Character state ${characterId} was not found or has changed`,
    )
    this.name = 'CharacterStateWriteConflictError'
  }
}

export class CharacterInitialVampireResolutionWriteConflictError
  extends Error {
  constructor(characterId: string) {
    super(
      `Initial vampire resolution ${characterId} was not found or changed concurrently`,
    )
    this.name =
      'CharacterInitialVampireResolutionWriteConflictError'
  }
}

export class CharacterEmbraceWriteConflictError
  extends Error {
  constructor(characterId: string) {
    super(
      `Character Embrace ${characterId} was not found or changed concurrently`,
    )
    this.name =
      'CharacterEmbraceWriteConflictError'
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
