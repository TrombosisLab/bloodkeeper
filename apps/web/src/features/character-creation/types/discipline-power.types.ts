import type {
  ContentSourceKey,
} from './content-source.types'

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

  /*
   * Resumen editorial propio de la aplicación.
   * No debe contener reproducción extensa
   * del texto de los manuales.
   */
  summary?: string

  /*
   * Fuente bibliográfica del contenido.
   */
  sourceKey?: ContentSourceKey

  /*
   * Página opcional para consulta en una
   * copia legítima del manual.
   */
  sourcePage?: number

  requirements?:
    DisciplinePowerRequirements
}
