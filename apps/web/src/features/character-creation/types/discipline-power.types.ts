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
   * Contrato simple histórico de SPEC-025-G.
   * Se conserva para compatibilidad.
   *
   * Un Poder NO debe declarar a la vez
   * diceCheck y mechanics.checks.
   */
  pool:
    DisciplinePowerDicePoolTermDefinition[]
}

export type DisciplinePowerActivationKind =
  | 'standalone'
  | 'enhancement'
  | 'extension'

export type DisciplinePowerRouseCostExemption =
  'targetIsFamulus'

export type DisciplinePowerRouseCostUnit =
  | 'distinctNight'
  | 'animalType'

export type DisciplinePowerRouseCostDefinition =
  | {
      kind: 'none'
    }
  | {
      kind: 'fixed'
      checks: number
      exemptions?:
        DisciplinePowerRouseCostExemption[]
    }
  | {
      kind: 'perUnit'
      checks: number
      unit: DisciplinePowerRouseCostUnit
      requiredUnits?: number
      exemptions?:
        DisciplinePowerRouseCostExemption[]
    }
  | {
      kind: 'inheritedFromBasePower'
    }
  | {
      kind: 'additionalToBasePower'
      checks: number
      scaling?: {
        kind:
          'perAdditionalTargetBeyondAttribute'
        attributeKey: AttributeKey
        checksPerTarget: number
      }
    }

export type DisciplinePowerSceneEndCondition =
  | 'movement'
  | 'detected'
  | 'voluntaryEnd'
  | 'orderCompleted'

export type DisciplinePowerUntilEvent =
  | 'targetDeath'
  | 'frenzyEnds'

export type DisciplinePowerConditionalWhen =
  | 'targetIsMortal'
  | 'targetIsVampire'

export type DisciplinePowerOutcome =
  | 'normalSuccess'
  | 'criticalSuccess'

export type DisciplinePowerDurationDefinition =
  | {
      kind: 'scene'
      endConditions?:
        DisciplinePowerSceneEndCondition[]
    }
  | {
      kind: 'passive'
    }
  | {
      kind: 'feeding'
    }
  | {
      kind: 'singleUse'
    }
  | {
      kind: 'night'
    }
  | {
      kind: 'nightWithEndConditions'
      endConditions: (
        | 'nextFeeding'
        | 'hungerFive'
      )[]
    }
  | {
      kind: 'untilResisted'
    }
  | {
      kind: 'turns'
      count: number
    }
  | {
      kind: 'turnsByMargin'
      baseTurns: number
    }
  | {
      kind: 'hoursByMargin'
      baseHours: number
    }
  | {
      kind: 'inheritedFromBasePower'
    }
  | {
      kind: 'nightsByMargin'
      baseNights: number
    }
  | {
      kind: 'indefinite'
    }
  | {
      kind: 'untilEvent'
      event: DisciplinePowerUntilEvent
    }
  | {
      kind: 'conditional'
      cases: {
        when: DisciplinePowerConditionalWhen
        duration:
          | {
              kind: 'scene'
            }
          | {
              kind: 'turnsByMargin'
              baseTurns: number
            }
      }[]
    }
  | {
      kind: 'outcomeBased'
      cases: {
        outcome: DisciplinePowerOutcome
        duration:
          | {
              kind: 'scene'
            }
          | {
              kind: 'indefinite'
            }
      }[]
    }

export type DisciplinePowerCheckResolutionDefinition =
  | {
      kind: 'fixedDifficulty'
      value: number
    }
  | {
      kind: 'contextualDifficulty'
      min?: number
      max?: number
    }
  | {
      kind: 'opposed'
      opposingPool:
        DisciplinePowerDicePoolTermDefinition[]
    }

export interface DisciplinePowerMechanicCheckDefinition {
  key: string

  role:
    | 'activation'
    | 'conditional'
    | 'detection'

  visibility?: 'normal' | 'hidden'

  pool:
    DisciplinePowerDicePoolTermDefinition[]

  resolution:
    DisciplinePowerCheckResolutionDefinition
}

export interface DisciplinePowerModifierDefinition {
  kind:
    | 'dicePool'
    | 'difficulty'

  value: number

  /*
   * Identificador corto del contexto mecánico.
   * No es texto visible ni una reproducción
   * de reglas del manual.
   */
  contextKey: string
}

export interface DisciplinePowerUsageLimitDefinition {
  kind: 'perScene'
  count: number
}

export interface DisciplinePowerMechanicsDefinition {
  /*
   * Resumen mecánico editorial propio,
   * breve y apto para ficha.
   */
  systemSummary?: string

  activation: {
    kind: DisciplinePowerActivationKind
  }

  rouseCost:
    DisciplinePowerRouseCostDefinition

  duration:
    DisciplinePowerDurationDefinition

  checks?:
    DisciplinePowerMechanicCheckDefinition[]

  modifiers?:
    DisciplinePowerModifierDefinition[]

  limits?:
    DisciplinePowerUsageLimitDefinition[]
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

  mechanics?:
    DisciplinePowerMechanicsDefinition
}
