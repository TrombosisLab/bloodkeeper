export type SkillKey =
  | 'athletics'
  | 'brawl'
  | 'craft'
  | 'drive'
  | 'firearms'
  | 'larceny'
  | 'melee'
  | 'stealth'
  | 'survival'
  | 'animalKen'
  | 'etiquette'
  | 'insight'
  | 'intimidation'
  | 'leadership'
  | 'performance'
  | 'persuasion'
  | 'streetwise'
  | 'subterfuge'
  | 'academics'
  | 'awareness'
  | 'finance'
  | 'investigation'
  | 'medicine'
  | 'occult'
  | 'politics'
  | 'science'
  | 'technology'

export type SkillDistributionMethod =
  | 'generalist'
  | 'balanced'
  | 'specialist'

export type CharacterSkillsDraft =
  Record<SkillKey, number>

export interface SkillDefinition {
  key: SkillKey
  label: string
  category:
    | 'physical'
    | 'social'
    | 'mental'
}

export interface SkillSpecialty {
  id: string
  skillKey: SkillKey
  name: string
}

export type CharacterSkillSpecialtiesDraft =
  SkillSpecialty[]

