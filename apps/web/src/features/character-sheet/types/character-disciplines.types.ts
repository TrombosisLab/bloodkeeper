export interface DisciplinePower {
  key: string
  name: string
  level: number
}

export interface CharacterDiscipline {
  key: string
  name: string
  value: number
  powers: DisciplinePower[]
}
