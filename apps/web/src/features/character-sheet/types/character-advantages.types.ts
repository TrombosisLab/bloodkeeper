import type {
  CharacterAdvantageCategory,
  CharacterAdvantageSelectionOrigin,
} from '../../character-creation/types/character-advantages-draft.types'
import type {
  CharacterAdvantageFunctionalType,
  CharacterAdvantageNarrativeCompletionStatus,
} from '../../character-creation/types/character-advantage-functional.types'

export type CharacterAdvantageCatalogStatus =
  | 'resolved'
  | 'missing'

export interface RatedTrait {
  key: string
  definitionKey: string
  name: string
  value: number
  category: CharacterAdvantageCategory
  categoryLabel: string
  functionalType: CharacterAdvantageFunctionalType
  functionalTypeLabel: string
  origin: CharacterAdvantageSelectionOrigin
  originLabel: string
  detail?: string
  sourceLabel?: string
  sourcePage?: number
  catalogStatus: CharacterAdvantageCatalogStatus
  narrativeStatus:
    CharacterAdvantageNarrativeCompletionStatus
  narrativeStatusLabel: string
}

export interface CharacterAdvantages {
  advantages: RatedTrait[]
  backgrounds: RatedTrait[]
  flaws: RatedTrait[]
}
