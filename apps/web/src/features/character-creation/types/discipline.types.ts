import type {
  CharacterRulesDisciplineKey,
} from '@v5r/character-rules'

import type {
  DisciplinePowerKey,
} from './discipline-power.types'

export type DisciplineKey =
  CharacterRulesDisciplineKey

export interface DisciplineDefinition {
  key: DisciplineKey
  name: string
  active: boolean
}

export type CharacterDisciplineOrigin =
  | 'creation'
  | 'predatorType'
  | 'thinBlood'

export interface CharacterDisciplineDraft {
  key: DisciplineKey
  value: number
  powerKeys: DisciplinePowerKey[]
  origin?: CharacterDisciplineOrigin
}

export type CharacterDisciplinesDraft =
  CharacterDisciplineDraft[]
