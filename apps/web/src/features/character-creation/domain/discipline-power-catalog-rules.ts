import type {
  DisciplinePowerDefinition,
} from '../types/discipline-power.types.ts'
import type {
  DisciplineKey,
} from '../types/discipline.types.ts'

export type DisciplinePowerCatalogViolation =
  | 'POWER_KEY_DUPLICATED'
  | 'POWER_NAME_EMPTY'
  | 'POWER_LEVEL_INVALID'
  | 'POWER_ACTIVE_STATE_INVALID'
  | 'POWER_DICE_POOL_EMPTY'
  | 'POWER_DICE_POOL_TERM_DUPLICATED'
  | 'POWER_DICE_CONTRACT_CONFLICT'
  | 'POWER_MECHANICS_SUMMARY_EMPTY'
  | 'POWER_MECHANICS_ROUSE_COUNT_INVALID'
  | 'POWER_MECHANICS_DURATION_INVALID'
  | 'POWER_MECHANICS_CHECK_KEY_EMPTY'
  | 'POWER_MECHANICS_CHECK_KEY_DUPLICATED'
  | 'POWER_MECHANICS_CHECK_POOL_EMPTY'
  | 'POWER_MECHANICS_CHECK_POOL_TERM_DUPLICATED'
  | 'POWER_MECHANICS_OPPOSING_POOL_EMPTY'
  | 'POWER_MECHANICS_DIFFICULTY_INVALID'
  | 'POWER_MECHANICS_MODIFIER_INVALID'
  | 'POWER_MECHANICS_LIMIT_INVALID'

export interface DisciplinePowerCatalogValidationResult {
  valid: boolean
  violations: DisciplinePowerCatalogViolation[]
}

function duplicatedPoolTerm(
  pool: readonly {
    kind: string
    key: string
  }[],
): boolean {
  const terms = new Set<string>()

  for (const term of pool) {
    const reference =
      `${term.kind}:${term.key}`

    if (terms.has(reference)) {
      return true
    }

    terms.add(reference)
  }

  return false
}

function positiveInteger(
  value: number,
): boolean {
  return (
    Number.isInteger(value) &&
    value >= 1
  )
}

function positiveDifficulty(
  value: number,
): boolean {
  return (
    Number.isInteger(value) &&
    value >= 1
  )
}

export function isDisciplinePowerActive(
  definition: DisciplinePowerDefinition,
): boolean {
  return definition.active !== false
}

export function getActiveDisciplinePowers(
  definitions:
    readonly DisciplinePowerDefinition[],
  disciplineKey?: DisciplineKey,
): DisciplinePowerDefinition[] {
  return definitions.filter(
    (definition) =>
      isDisciplinePowerActive(definition) &&
      (
        disciplineKey === undefined ||
        definition.disciplineKey ===
          disciplineKey
      ),
  )
}

export function validateDisciplinePowerCatalog(
  definitions:
    readonly DisciplinePowerDefinition[],
): DisciplinePowerCatalogValidationResult {
  const violations:
    DisciplinePowerCatalogViolation[] = []
  const keys = new Set<string>()

  for (const definition of definitions) {
    if (keys.has(definition.key)) {
      violations.push('POWER_KEY_DUPLICATED')
    }

    keys.add(definition.key)

    if (definition.name.trim().length === 0) {
      violations.push('POWER_NAME_EMPTY')
    }

    if (
      !Number.isInteger(definition.level) ||
      definition.level < 1 ||
      definition.level > 5
    ) {
      violations.push('POWER_LEVEL_INVALID')
    }

    if (typeof definition.active !== 'boolean') {
      violations.push(
        'POWER_ACTIVE_STATE_INVALID',
      )
    }

    if (definition.diceCheck) {
      if (
        definition.diceCheck.pool.length === 0
      ) {
        violations.push(
          'POWER_DICE_POOL_EMPTY',
        )
      }

      if (
        duplicatedPoolTerm(
          definition.diceCheck.pool,
        )
      ) {
        violations.push(
          'POWER_DICE_POOL_TERM_DUPLICATED',
        )
      }
    }

    if (
      definition.diceCheck &&
      definition.mechanics?.checks
    ) {
      violations.push(
        'POWER_DICE_CONTRACT_CONFLICT',
      )
    }

    const mechanics =
      definition.mechanics

    if (mechanics) {
      if (
        mechanics.systemSummary !==
          undefined &&
        mechanics.systemSummary.trim()
          .length === 0
      ) {
        violations.push(
          'POWER_MECHANICS_SUMMARY_EMPTY',
        )
      }

      const rouseCost =
        mechanics.rouseCost

      if (
        (
          rouseCost.kind === 'fixed' ||
          rouseCost.kind ===
            'additionalToBasePower'
        ) &&
        !positiveInteger(
          rouseCost.checks,
        )
      ) {
        violations.push(
          'POWER_MECHANICS_ROUSE_COUNT_INVALID',
        )
      }

      if (
        rouseCost.kind ===
          'additionalToBasePower' &&
        rouseCost.scaling &&
        !positiveInteger(
          rouseCost.scaling
            .checksPerTarget,
        )
      ) {
        violations.push(
          'POWER_MECHANICS_ROUSE_COUNT_INVALID',
        )
      }

      const duration =
        mechanics.duration

      if (
        duration.kind === 'scene' &&
        duration.endConditions !==
          undefined
      ) {
        const endConditions =
          duration.endConditions

        const allowedSceneEndConditions =
          new Set<string>([
            'movement',
            'detected',
            'voluntaryEnd',
          ])

        if (
          !Array.isArray(
            endConditions,
          ) ||
          new Set(endConditions).size !==
            endConditions.length ||
          endConditions.some(
            condition =>
              !allowedSceneEndConditions.has(
                condition,
              ),
          )
        ) {
          violations.push(
            'POWER_MECHANICS_DURATION_INVALID',
          )
        }
      }

      if (
        duration.kind ===
          'nightsByMargin' &&
        !positiveInteger(
          duration.baseNights,
        )
      ) {
        violations.push(
          'POWER_MECHANICS_DURATION_INVALID',
        )
      }

      if (
        duration.kind ===
          'hoursByMargin' &&
        !positiveInteger(
          duration.baseHours,
        )
      ) {
        violations.push(
          'POWER_MECHANICS_DURATION_INVALID',
        )
      }

      if (
        duration.kind === 'turns' &&
        !positiveInteger(
          duration.count,
        )
      ) {
        violations.push(
          'POWER_MECHANICS_DURATION_INVALID',
        )
      }

      if (
        duration.kind ===
          'nightWithEndConditions'
      ) {
        const endConditions =
          duration.endConditions

        const allowedEndConditions =
          new Set<string>([
            'nextFeeding',
            'hungerFive',
          ])

        if (
          !Array.isArray(
            endConditions,
          ) ||
          endConditions.length === 0 ||
          new Set(endConditions).size !==
            endConditions.length ||
          endConditions.some(
            condition =>
              !allowedEndConditions.has(
                condition,
              ),
          )
        ) {
          violations.push(
            'POWER_MECHANICS_DURATION_INVALID',
          )
        }
      }

      const checkKeys =
        new Set<string>()

      for (
        const check of
        mechanics.checks ?? []
      ) {
        if (check.key.trim().length === 0) {
          violations.push(
            'POWER_MECHANICS_CHECK_KEY_EMPTY',
          )
        }

        if (checkKeys.has(check.key)) {
          violations.push(
            'POWER_MECHANICS_CHECK_KEY_DUPLICATED',
          )
        }

        checkKeys.add(check.key)

        if (check.pool.length === 0) {
          violations.push(
            'POWER_MECHANICS_CHECK_POOL_EMPTY',
          )
        }

        if (
          duplicatedPoolTerm(check.pool)
        ) {
          violations.push(
            'POWER_MECHANICS_CHECK_POOL_TERM_DUPLICATED',
          )
        }

        const resolution =
          check.resolution

        if (
          resolution.kind ===
            'fixedDifficulty' &&
          !positiveDifficulty(
            resolution.value,
          )
        ) {
          violations.push(
            'POWER_MECHANICS_DIFFICULTY_INVALID',
          )
        }

        if (
          resolution.kind ===
            'contextualDifficulty'
        ) {
          const min =
            resolution.min
          const max =
            resolution.max

          if (
            (
              min !== undefined &&
              !positiveDifficulty(min)
            ) ||
            (
              max !== undefined &&
              !positiveDifficulty(max)
            ) ||
            (
              min !== undefined &&
              max !== undefined &&
              min > max
            )
          ) {
            violations.push(
              'POWER_MECHANICS_DIFFICULTY_INVALID',
            )
          }
        }

        if (
          resolution.kind ===
            'opposed'
        ) {
          if (
            resolution.opposingPool
              .length === 0
          ) {
            violations.push(
              'POWER_MECHANICS_OPPOSING_POOL_EMPTY',
            )
          }

          if (
            duplicatedPoolTerm(
              resolution.opposingPool,
            )
          ) {
            violations.push(
              'POWER_MECHANICS_CHECK_POOL_TERM_DUPLICATED',
            )
          }
        }
      }

      for (
        const modifier of
        mechanics.modifiers ?? []
      ) {
        if (
          !Number.isInteger(
            modifier.value,
          ) ||
          modifier.value === 0 ||
          modifier.contextKey.trim()
            .length === 0
        ) {
          violations.push(
            'POWER_MECHANICS_MODIFIER_INVALID',
          )
        }
      }

      for (
        const limit of
        mechanics.limits ?? []
      ) {
        if (
          !positiveInteger(limit.count)
        ) {
          violations.push(
            'POWER_MECHANICS_LIMIT_INVALID',
          )
        }
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations: [...new Set(violations)],
  }
}
