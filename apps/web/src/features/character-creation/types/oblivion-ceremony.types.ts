import type {
  ContentSourceKey,
} from './content-source.types'

import type {
  DisciplinePowerKey,
} from './discipline-power.types'

export type OblivionCeremonyKey =
  string

export interface OblivionCeremonyRequirements {
  prerequisitePowerKeys?:
    DisciplinePowerKey[]
}

export interface OblivionCeremonyDefinition {
  key:
    OblivionCeremonyKey

  name:
    string

  level:
    number

  summary?:
    string

  sourceKey?:
    ContentSourceKey

  sourcePage?:
    number

  requirements?:
    OblivionCeremonyRequirements
}

export interface CharacterOblivionCeremoniesDraft {
  ceremonyKeys:
    OblivionCeremonyKey[]
}
