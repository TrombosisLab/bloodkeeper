import {
  attributeDefinitions,
} from '../../character-creation/data/attribute-definitions.ts'
import {
  disciplineDefinitions,
} from '../../character-creation/data/discipline-definitions.ts'
import {
  skillDefinitions,
} from '../../character-creation/data/skill-definitions.ts'

import type {
  DisciplinePowerDicePoolTermDefinition,
  DisciplinePowerMechanicCheckDefinition,
  DisciplinePowerMechanicsDefinition,
  DisciplinePowerModifierDefinition,
  DisciplinePowerUsageLimitDefinition,
} from '../../character-creation/types/discipline-power.types.ts'

import type {
  DisciplinePowerMechanicCheckView,
  DisciplinePowerMechanicsView,
} from '../types/character-disciplines.types.ts'

const attributeLabels =
  new Map(
    attributeDefinitions.map(
      (definition) => [
        definition.key,
        definition.label,
      ],
    ),
  )

const skillLabels =
  new Map(
    skillDefinitions.map(
      (definition) => [
        definition.key,
        definition.label,
      ],
    ),
  )

const disciplineLabels =
  new Map(
    disciplineDefinitions.map(
      (definition) => [
        definition.key,
        definition.name,
      ],
    ),
  )

function assertNever(
  value: never,
): never {
  throw new Error(
    'Variante mecánica no soportada',
  )
}

const modifierContextLabels:
  Readonly<Record<string, string>> = {
    recordedIdentification:
      'identificación en grabaciones',
    automatedSurveillanceEvasion:
      'evitar vigilancia automatizada',
  }

function formatCount(
  count: number,
  singular: string,
  plural: string,
): string {
  return `${count} ${
    count === 1
      ? singular
      : plural
  }`
}

function formatPoolTerm(
  term: DisciplinePowerDicePoolTermDefinition,
): string {
  switch (term.kind) {
    case 'attribute':
      return (
        attributeLabels.get(term.key) ??
        'Atributo indicado'
      )

    case 'skill':
      return (
        skillLabels.get(term.key) ??
        'Habilidad indicada'
      )

    case 'discipline':
      return (
        disciplineLabels.get(term.key) ??
        'Disciplina indicada'
      )
  }
}

function formatPool(
  pool:
    readonly DisciplinePowerDicePoolTermDefinition[],
): string {
  return pool
    .map(formatPoolTerm)
    .join(' + ')
}

function formatRouseCost(
  mechanics: DisciplinePowerMechanicsDefinition,
): string {
  const cost = mechanics.rouseCost

  switch (cost.kind) {
    case 'none':
      return 'Sin Control de Enardecimiento'

    case 'fixed':
      return formatCount(
        cost.checks,
        'Control de Enardecimiento',
        'Controles de Enardecimiento',
      )

    case 'inheritedFromBasePower':
      return 'Hereda el coste del Poder base'

    case 'additionalToBasePower': {
      const base =
        `${formatCount(
          cost.checks,
          'Control de Enardecimiento adicional',
          'Controles de Enardecimiento adicionales',
        )} al Poder base`

      if (!cost.scaling) {
        return base
      }

      const attribute =
        attributeLabels.get(
          cost.scaling.attributeKey,
        ) ?? 'el Atributo indicado'

      const scaling =
        formatCount(
          cost.scaling.checksPerTarget,
          'Control adicional',
          'Controles adicionales',
        )

      return (
        `${base}; ${scaling} por cada objetivo ` +
        `adicional por encima de ${attribute}`
      )
    }
  }
}

function formatEndCondition(
  condition: string,
): string {
  switch (condition) {
    case 'movement':
      return 'al moverse'

    case 'detected':
      return 'al ser detectado'

    case 'voluntaryEnd':
      return 'al terminarlo voluntariamente'

    default:
      return 'al cumplirse otra condición del Poder'
  }
}

function formatNightEndCondition(
  condition:
    | 'nextFeeding'
    | 'hungerFive',
): string {
  switch (condition) {
    case 'nextFeeding':
      return 'la siguiente alimentación'

    case 'hungerFive':
      return 'Ansia 5'
  }
}

function formatDuration(
  mechanics: DisciplinePowerMechanicsDefinition,
): string {
  const duration = mechanics.duration

  switch (duration.kind) {
    case 'scene': {
      if (
        !duration.endConditions ||
        duration.endConditions.length === 0
      ) {
        return 'Una escena'
      }

      return (
        'Una escena; termina ' +
        duration.endConditions
          .map(formatEndCondition)
          .join(' o ')
      )
    }

    case 'passive':
      return 'Pasiva'

    case 'feeding':
      return 'Una alimentación'

    case 'singleUse':
      return 'Un uso'

    case 'night':
      return 'Una noche'

    case 'nightWithEndConditions':
      return (
        'Una noche; termina con ' +
        duration.endConditions
          .map(
            formatNightEndCondition,
          )
          .join(' o ')
      )

    case 'untilResisted':
      return 'Hasta resistir con éxito'

    case 'turns':
      return formatCount(
        duration.count,
        'turno',
        'turnos',
      )

    case 'hoursByMargin':
      return (
        `${formatCount(
          duration.baseHours,
          'hora base',
          'horas base',
        )}; aumenta según el margen`
      )

    case 'inheritedFromBasePower':
      return 'Hereda la duración del Poder base'

    case 'nightsByMargin':
      return (
        `${formatCount(
          duration.baseNights,
          'noche base',
          'noches base',
        )}; aumenta según el margen`
      )
  }
}

function formatCheckRole(
  role: 'activation' | 'conditional' | 'detection',
): string {
  switch (role) {
    case 'activation':
      return 'Activación'

    case 'conditional':
      return 'Condicional'

    case 'detection':
      return 'Detección'
  }
}

function formatCheck(
  check:
    DisciplinePowerMechanicCheckDefinition,
): DisciplinePowerMechanicCheckView {
  const label =
    `${formatCheckRole(check.role)}${
      check.visibility === 'hidden'
        ? ' · prueba oculta'
        : ''
    }`

  const pool =
    formatPool(check.pool)

  switch (check.resolution.kind) {
    case 'fixedDifficulty':
      return {
        label,
        detail:
          `${pool} · Dificultad ` +
          `${check.resolution.value}`,
      }

    case 'contextualDifficulty': {
      const {
        min,
        max,
      } = check.resolution

      if (
        min !== undefined &&
        max !== undefined
      ) {
        return {
          label,
          detail:
            `${pool} · Dificultad ${min}–${max}`,
        }
      }

      return {
        label,
        detail:
          `${pool} · Dificultad contextual`,
      }
    }

    case 'opposed':
      return {
        label,
        detail:
          `${pool} contra ` +
          formatPool(
            check.resolution.opposingPool,
          ),
      }

    default:
      return assertNever(
        check.resolution,
      )
  }
}

function formatSigned(
  value: number,
): string {
  return value > 0
    ? `+${value}`
    : `${value}`
}

function formatModifier(
  modifier:
    DisciplinePowerModifierDefinition,
): string {
  const context =
    modifierContextLabels[
      modifier.contextKey
    ] ?? 'aplicación contextual'

  switch (modifier.kind) {
    case 'difficulty':
      return (
        `${formatSigned(modifier.value)} a la dificultad · ` +
        context
      )

    case 'dicePool':
      return (
        `${formatSigned(modifier.value)} dados · ` +
        context
      )

    default:
      throw new Error(
        'Tipo de modificador mecánico no soportado',
      )
  }
}

function formatLimit(
  limit:
    DisciplinePowerUsageLimitDefinition,
): string {
  switch (limit.kind) {
    case 'perScene':
      return formatCount(
        limit.count,
        'vez por escena',
        'veces por escena',
      )

    default:
      throw new Error(
        'Tipo de límite mecánico no soportado',
      )
  }
}

export function presentDisciplinePowerMechanics(
  mechanics:
    DisciplinePowerMechanicsDefinition,
): DisciplinePowerMechanicsView {
  return {
    systemSummary:
      mechanics.systemSummary,
    cost:
      formatRouseCost(mechanics),
    duration:
      formatDuration(mechanics),
    checks:
      mechanics.checks?.map(
        formatCheck,
      ) ?? [],
    modifiers:
      mechanics.modifiers?.map(
        formatModifier,
      ) ?? [],
    limits:
      mechanics.limits?.map(
        formatLimit,
      ) ?? [],
  }
}
