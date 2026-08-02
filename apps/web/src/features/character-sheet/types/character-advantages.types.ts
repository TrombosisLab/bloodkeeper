import type {
  CharacterAdvantageCategory,
  CharacterAdvantageSelectionOrigin,
} from '../../character-creation/types/character-advantages-draft.types'

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
  origin: CharacterAdvantageSelectionOrigin
  detail?: string
  catalogStatus: CharacterAdvantageCatalogStatus
}

export interface CharacterAdvantages {
  advantages: RatedTrait[]
  backgrounds: RatedTrait[]
  flaws: RatedTrait[]
}
