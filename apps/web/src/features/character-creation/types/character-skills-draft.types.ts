import type {
  CharacterRulesSkillCategory,
  CharacterRulesSkillKey,
} from '@v5r/character-rules'

export type SkillKey =
  CharacterRulesSkillKey

export type SkillDistributionMethod =
  | 'generalist'
  | 'balanced'
  | 'specialist'

export type CharacterSkillsDraft =
  Record<SkillKey, number>

export interface SkillDefinition {
  key: SkillKey
  label: string
  category: CharacterRulesSkillCategory
  active: boolean
}

export type SkillSpecialtyOrigin =
  | 'creation'
  | 'predatorType'
  | 'evolution'

export interface SkillSpecialty {
  id: string
  skillKey: SkillKey
  name: string
  origin?: SkillSpecialtyOrigin
}

export type CharacterSkillSpecialtiesDraft =
  SkillSpecialty[]
