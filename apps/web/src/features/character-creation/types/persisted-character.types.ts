import type {
  CharacterDraft,
} from './character-draft.types.ts'

import type {
  CharacterIdentityDraft,
} from './character-identity-draft.types.ts'

import type {
  CreationStepId,
} from './creation-step.types.ts'

export type CharacterLifecycleStatus =
  | 'draft'
  | 'active'
  | 'archived'

export type PersistedCharacterIdentity =
  Omit<CharacterIdentityDraft, 'chronicle'>

export interface PersistedCharacterData
  extends Omit<
    CharacterDraft,
    'identity' | 'skillDistributionMethod'
  > {
  identity: PersistedCharacterIdentity
}

export interface PersistedCharacterCreationState {
  currentStepId: CreationStepId
  skillDistributionMethod:
    CharacterDraft['skillDistributionMethod']
}

export interface PersistedCharacter {
  schemaVersion: 1
  characterId: string
  ownerId: string
  chronicleId: string | null
  status: CharacterLifecycleStatus
  revision: number
  createdAt: string
  updatedAt: string
  creation: PersistedCharacterCreationState
  data: PersistedCharacterData
}

export interface CreatePersistedCharacterSnapshotInput {
  characterId: string
  ownerId: string
  chronicleId: string | null
  status: CharacterLifecycleStatus
  revision: number
  createdAt: string
  updatedAt: string
  currentStepId: CreationStepId
  draft: CharacterDraft
}
