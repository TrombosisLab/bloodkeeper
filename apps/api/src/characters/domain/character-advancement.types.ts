import type {
  CharacterAdvantageCategory,
  PersistedCharacterAdvantageDetails,
} from './persisted-character.types'

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

export type CharacterDisciplineCostClass =
  | 'clan'
  | 'other'
  | 'caitiff'

export type CharacterAdvancementRequest =
  | { readonly kind: 'attribute'; readonly key: string }
  | { readonly kind: 'skill'; readonly key: string }
  | {
      readonly kind: 'specialty'
      readonly skillKey: string
      readonly name: string
    }
  | {
      readonly kind: 'discipline'
      readonly disciplineKey: string
      readonly powerKey: string
    }
  | { readonly kind: 'ritual'; readonly key: string }
  | { readonly kind: 'formula'; readonly key: string }
  | { readonly kind: 'ceremony'; readonly key: string }
  | {
      readonly kind: 'advantage'
      readonly definitionKey: string
      readonly selectionId: string | null
      readonly targetRating: number
      readonly parentSelectionId?: string | null
      readonly details?: PersistedCharacterAdvantageDetails | null
    }
  | { readonly kind: 'bloodPotency' }

export interface CharacterAdvancementIssue {
  readonly code: string
  readonly message: string
}

export interface CharacterAdvancementPreview {
  readonly characterId: string
  readonly revision: number
  readonly kind: CharacterAdvancementKind
  readonly key: string
  readonly currentRating: number | null
  readonly newRating: number | null
  readonly cost: number | null
  readonly available: number
  readonly eligible: boolean
  readonly issues: readonly CharacterAdvancementIssue[]
  readonly consequences: readonly string[]
}


export type CharacterAdvancementPurchaseMutation =
  | Exclude<CharacterAdvancementRequest, { readonly kind: 'advantage' }>
  | {
      readonly kind: 'advantage'
      readonly definitionKey: string
      readonly selectionId: string
      readonly create: boolean
      readonly targetRating: number
      readonly category: CharacterAdvantageCategory
      readonly parentSelectionId: string | null
      readonly details: PersistedCharacterAdvantageDetails | null
    }

export interface PurchaseCharacterAdvancementData {
  readonly characterId: string
  readonly actorId: string
  readonly expectedRevision: number
  readonly operationId: string
  readonly cost: number
  readonly acquisitionType: CharacterAdvancementKind
  readonly acquisitionKey: string
  readonly mutation: CharacterAdvancementPurchaseMutation
}
