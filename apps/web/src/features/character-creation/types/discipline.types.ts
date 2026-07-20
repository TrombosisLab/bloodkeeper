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
}

export interface CharacterDisciplineDraft {
  key: DisciplineKey
  value: number
}

export type CharacterDisciplinesDraft =
  CharacterDisciplineDraft[]
