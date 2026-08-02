export type CharacterLifecycleStatus =
  | 'draft'
  | 'active'
  | 'archived'

export type CharacterCreationStep =
  | 'identity'
  | 'attributes'
  | 'skills'
  | 'blood'
  | 'disciplines'
  | 'advantages'
  | 'humanity'
  | 'review'

export type SkillDistributionMethod =
  | 'generalist'
  | 'balanced'
  | 'specialist'

export interface PersistedCharacterIdentity {
  name: string
  concept: string | null
  predatorTypeKey: string | null
  ambition: string | null
  clanKey: string | null
  sire: string | null
  desire: string | null
  generation: number | null
}

export interface PersistedCharacterCreationState {
  schemaVersion: number
  currentStep: CharacterCreationStep
  skillDistributionMethod: SkillDistributionMethod
  updatedAt: Date
}

export interface PersistedCharacterDraft {
  characterId: string
  ownerId: string
  chronicleId: string | null
  status: CharacterLifecycleStatus
  revision: number
  createdAt: Date
  updatedAt: Date
  identity: PersistedCharacterIdentity
  creation: PersistedCharacterCreationState
}

export interface CreateCharacterDraftData {
  ownerId: string
  chronicleId: string | null
  identity: Partial<PersistedCharacterIdentity>
  creation: {
    currentStep: CharacterCreationStep
    skillDistributionMethod: SkillDistributionMethod
  }
}

export interface UpdateCharacterDraftData {
  characterId: string
  expectedRevision: number
  chronicleId?: string | null
  identity?: Partial<PersistedCharacterIdentity>
  creation?: Partial<
    Pick<
      PersistedCharacterCreationState,
      'currentStep' | 'skillDistributionMethod'
    >
  >
}
