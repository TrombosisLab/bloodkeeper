import type {
  CharacterAdvantageInstanceDetails,
} from '../../character-creation/types/character-advantages-draft.types.ts'

export type CharacterExperienceMovementType =
  | 'grant'
  | 'spend'
  | 'correction'

export interface CharacterExperienceMovement {
  id: string
  characterId: string
  actorId: string
  sessionId: string | null
  type: CharacterExperienceMovementType
  component: 'earned' | 'spent'
  amount: number
  reason: string
  acquisitionType: string | null
  acquisitionKey: string | null
  correctsMovementId: string | null
  createdAt: string
}

export interface CharacterExperienceLedger {
  characterId: string
  total: number
  spent: number
  available: number
  movements: readonly CharacterExperienceMovement[]
}

export interface CharacterExperienceLedgerPage {
  characterId: string
  total: number
  spent: number
  available: number
  movements: readonly CharacterExperienceMovement[]
  nextOffset: number | null
}

export interface CharacterExperienceListQuery {
  limit?: number
  offset?: number
}

export type CharacterAdvancementKind =
  | 'attribute'
  | 'skill'
  | 'specialty'
  | 'discipline'
  | 'ritual'
  | 'formula'
  | 'ceremony'
  | 'advantage'
  | 'bloodPotency'

export type CharacterAdvancementRequest =
  | { kind: 'attribute'; key: string }
  | { kind: 'skill'; key: string }
  | { kind: 'specialty'; skillKey: string; name: string }
  | { kind: 'discipline'; disciplineKey: string; powerKey: string }
  | { kind: 'ritual'; key: string }
  | { kind: 'formula'; key: string }
  | { kind: 'ceremony'; key: string }
  | {
      kind: 'advantage'
      definitionKey: string
      selectionId: string | null
      targetRating: number
      parentSelectionId?: string | null
      details?: CharacterAdvantageInstanceDetails | null
    }
  | { kind: 'bloodPotency' }

export interface CharacterAdvancementIssue {
  code: string
  message: string
}

export interface CharacterAdvancementPreview {
  characterId: string
  revision: number
  kind: CharacterAdvancementKind
  key: string
  currentRating: number | null
  newRating: number | null
  cost: number | null
  available: number
  eligible: boolean
  issues: readonly CharacterAdvancementIssue[]
  consequences: readonly string[]
}

export interface CharacterAdvancementPurchaseResult {
  experience: CharacterExperienceLedger
  preview: CharacterAdvancementPreview
}

export interface CharacterExperienceGateway {
  load(
    characterId: string,
    query?: CharacterExperienceListQuery,
  ): Promise<CharacterExperienceLedgerPage>
  preview(
    characterId: string,
    advancement: CharacterAdvancementRequest,
    useDyscrasiaExperience?: boolean,
  ): Promise<CharacterAdvancementPreview>
  purchase(
    characterId: string,
    expectedRevision: number,
    operationId: string,
    advancement: CharacterAdvancementRequest,
    useDyscrasiaExperience?: boolean,
  ): Promise<CharacterAdvancementPurchaseResult>
}
