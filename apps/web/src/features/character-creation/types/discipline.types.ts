import type {
  DisciplinePowerKey,
} from './discipline-power.types'

export type DisciplineKey =
  | 'animalism'
  | 'auspex'
  | 'bloodSorcery'
  | 'celerity'
  | 'dominate'
  | 'fortitude'
  | 'obfuscate'
  | 'oblivion'
  | 'potence'
  | 'presence'
  | 'protean'
  | 'thinBloodAlchemy'

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
