import type {
  DisciplineKey,
} from './discipline.types'

export type DisciplinePowerKey = string

export interface DisciplineAmalgamRequirement {
  disciplineKey: DisciplineKey
  minimumLevel: number
}

export interface DisciplinePowerRequirements {
  prerequisitePowerKeys?:
    DisciplinePowerKey[]

  amalgam?:
    DisciplineAmalgamRequirement
}

export interface DisciplinePowerDefinition {
  key: DisciplinePowerKey
  disciplineKey: DisciplineKey
  name: string
  level: number
  requirements?:
    DisciplinePowerRequirements
}
