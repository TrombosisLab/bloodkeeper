import type {
  ContentSourceKey,
} from './content-source.types'

import type {
  AttributeKey,
} from './character-attributes-draft.types'

import type {
  SkillKey,
} from './character-skills-draft.types'

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

export type DisciplinePowerDicePoolTermDefinition =
  | {
      kind: 'attribute'
      key: AttributeKey
    }
  | {
      kind: 'skill'
      key: SkillKey
    }
  | {
      kind: 'discipline'
      key: DisciplineKey
    }

export interface DisciplinePowerDiceCheckDefinition {
  /*
   * Referencias estructuradas que el módulo
   * de dados podrá consumir. Aquí no se suma
   * la reserva ni se ejecuta ninguna tirada.
   */
  pool:
    DisciplinePowerDicePoolTermDefinition[]
}

export interface DisciplinePowerDefinition {
  key: DisciplinePowerKey

  disciplineKey: DisciplineKey

  name: string

  level: number

  /*
   * Los catálogos fuente pueden omitirlo.
   * La fachada canónica materializa siempre
   * un booleano y permite desactivar opciones.
   */
  active?: boolean

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

  diceCheck?:
    DisciplinePowerDiceCheckDefinition
}
