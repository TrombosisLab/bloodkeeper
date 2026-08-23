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

function formatRouseExemptionSuffix(
  exemptions:
    readonly 'targetIsFamulus'[] | undefined,
): string {
  if (
    !exemptions ||
    exemptions.length === 0
  ) {
    return ''
  }

  if (
    exemptions.includes(
      'targetIsFamulus',
    )
  ) {
    return '; sin coste sobre el famulus'
  }

  return ''
}

function formatRouseConditionalWhen(
  condition:
    | 'passiveUse'
    | 'activeUse',
): string {
  switch (condition) {
    case 'passiveUse':
      return 'Uso pasivo'

    case 'activeUse':
      return 'Uso activo'
  }
}

function formatConditionalRouseCost(
  cost:
    | {
        kind: 'none'
      }
    | {
        kind: 'fixed'
        checks: number
      },
): string {
  switch (cost.kind) {
    case 'none':
      return 'Sin Control de Enardecimiento'

    case 'fixed':
      return formatCount(
        cost.checks,
        'Control de Enardecimiento',
        'Controles de Enardecimiento',
      )
  }
}

function formatRouseCostDefinition(
  cost:
    DisciplinePowerMechanicsDefinition['rouseCost'],
): string {
  switch (cost.kind) {
    case 'none':
      return 'Sin Control de Enardecimiento'

    case 'fixed': {
      const base =
        formatCount(
          cost.checks,
          'Control de Enardecimiento',
          'Controles de Enardecimiento',
        )

      return (
        base +
        formatRouseExemptionSuffix(
          cost.exemptions,
        )
      )
    }

    case 'atLeast':
      return (
        `${cost.minChecks} o más ` +
        'Controles de Enardecimiento'
      )

    case 'range':
      return (
        `${cost.minChecks}–${cost.maxChecks} ` +
        'Controles de Enardecimiento'
      )

    case 'perUnit': {
      const checkLabel =
        formatCount(
          cost.checks,
          'Control de Enardecimiento',
          'Controles de Enardecimiento',
        )

      switch (cost.unit) {
        case 'distinctNight': {
          const base =
            cost.requiredUnits
              ? (
                  `${checkLabel} en cada una de ` +
                  `${cost.requiredUnits} noches distintas`
                )
              : (
                  `${checkLabel} por noche distinta`
                )

          return (
            base +
            formatRouseExemptionSuffix(
              cost.exemptions,
            )
          )
        }

        case 'animalType':
          return (
            `${checkLabel} por tipo de animal` +
            formatRouseExemptionSuffix(
              cost.exemptions,
            )
          )
      }
    }

    case 'conditional':
      return cost.cases
        .map(
          item =>
            `${formatRouseConditionalWhen(
              item.when,
            )}: ${formatConditionalRouseCost(
              item.cost,
            )}`,
        )
        .join('; ')

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


function formatRouseCost(
  mechanics: DisciplinePowerMechanicsDefinition,
): string {
  return formatRouseCostDefinition(
    mechanics.rouseCost,
  )
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

    case 'orderCompleted':
      return 'al cumplirse la orden'

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

function formatUntilEvent(
  event:
    | 'targetDeath'
    | 'frenzyEnds',
): string {
  switch (event) {
    case 'targetDeath':
      return 'Hasta la muerte del objetivo'

    case 'frenzyEnds':
      return 'Mientras dure el Frenesí'
  }
}

function formatConditionalWhen(
  condition:
    | 'targetIsMortal'
    | 'targetIsVampire'
    | 'targetIsWilling'
    | 'targetIsUnwilling'
    | 'informationGathering'
    | 'surveillance',
): string {
  switch (condition) {
    case 'targetIsMortal':
      return 'Mortal'

    case 'targetIsVampire':
      return 'Vampiro'

    case 'targetIsWilling':
      return 'Objetivo voluntario'

    case 'targetIsUnwilling':
      return 'Objetivo no voluntario'

    case 'informationGathering':
      return 'Recopilar información'

    case 'surveillance':
      return 'Vigilancia'
  }
}

function formatOutcome(
  outcome:
    | 'normalSuccess'
    | 'criticalSuccess',
): string {
  switch (outcome) {
    case 'normalSuccess':
      return 'Éxito'

    case 'criticalSuccess':
      return 'Crítico'
  }
}

function formatMinutes(
  count: number | undefined,
): string {
  if (count === undefined) {
    return 'Unos minutos'
  }

  return (
    `Aproximadamente ${formatCount(
      count,
      'minuto',
      'minutos',
    )}`
  )
}

function formatConditionalDuration(
  duration:
    | {
        kind: 'scene'
      }
    | {
        kind: 'turnsByMargin'
        baseTurns: number
      }
    | {
        kind: 'minutes'
        count?: number
      }
    | {
        kind: 'night'
      },
): string {
  switch (duration.kind) {
    case 'scene':
      return 'Una escena'

    case 'turnsByMargin':
      return (
        `${formatCount(
          duration.baseTurns,
          'turno base',
          'turnos base',
        )}; aumenta según el margen`
      )

    case 'minutes':
      return formatMinutes(
        duration.count,
      )

    case 'night':
      return 'Una noche'
  }
}

function formatOutcomeDuration(
  duration:
    | {
        kind: 'scene'
      }
    | {
        kind: 'indefinite'
      },
): string {
  switch (duration.kind) {
    case 'scene':
      return 'Una escena'

    case 'indefinite':
      return 'Indefinida'
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

    case 'turnsByMargin':
      return (
        `${formatCount(
          duration.baseTurns,
          'turno base',
          'turnos base',
        )}; aumenta según el margen`
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

    case 'indefinite':
      return 'Indefinida'

    case 'untilDeactivated':
      return 'Hasta desactivarlo'

    case 'untilEnded':
      return 'Hasta que termine'

    case 'minutes':
      return formatMinutes(
        duration.count,
      )

    case 'untilEvent':
      return formatUntilEvent(
        duration.event,
      )

    case 'conditional':
      return duration.cases
        .map(
          item =>
            `${formatConditionalWhen(
              item.when,
            )}: ${formatConditionalDuration(
              item.duration,
            )}`,
        )
        .join('; ')

    case 'outcomeBased':
      return duration.cases
        .map(
          item =>
            `${formatOutcome(
              item.outcome,
            )}: ${formatOutcomeDuration(
              item.duration,
            )}`,
        )
        .join('; ')
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

    case 'perHour':
      return formatCount(
        limit.count,
        'vez por hora',
        'veces por hora',
      )

    default:
      throw new Error(
        'Tipo de límite mecánico no soportado',
      )
  }
}


function formatCheckMetadataSuffix(
  check:
    DisciplinePowerMechanicCheckDefinition,
): string {
  const metadata: string[] = []

  if (check.rouseCost) {
    metadata.push(
      formatRouseCostDefinition(
        check.rouseCost,
      ),
    )
  }

  for (
    const limit of
    check.limits ?? []
  ) {
    metadata.push(
      formatLimit(limit),
    )
  }

  return metadata.length > 0
    ? ` · ${metadata.join(' · ')}`
    : ''
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
        check => {
          const view =
            formatCheck(check)

          return {
            ...view,
            detail:
              view.detail +
              formatCheckMetadataSuffix(
                check,
              ),
          }
        },
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
