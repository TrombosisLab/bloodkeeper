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

function validateDisciplinePowerRouseCost(
  rouseCost:
    NonNullable<
      DisciplinePowerDefinition['mechanics']
    >['rouseCost'],
  violations: string[],
): void {
  if (
    (
      rouseCost.kind === 'fixed' ||
      rouseCost.kind ===
        'additionalToBasePower' ||
      rouseCost.kind === 'perUnit'
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

  if (
    rouseCost.kind === 'atLeast' &&
    !positiveInteger(
      rouseCost.minChecks,
    )
  ) {
    violations.push(
      'POWER_MECHANICS_ROUSE_COUNT_INVALID',
    )
  }

  if (
    rouseCost.kind === 'range' &&
    (
      !positiveInteger(
        rouseCost.minChecks,
      ) ||
      !positiveInteger(
        rouseCost.maxChecks,
      ) ||
      rouseCost.maxChecks <
        rouseCost.minChecks
    )
  ) {
    violations.push(
      'POWER_MECHANICS_ROUSE_COUNT_INVALID',
    )
  }

  if (
    rouseCost.kind === 'perUnit'
  ) {
    if (
      rouseCost.requiredUnits !==
        undefined &&
      !positiveInteger(
        rouseCost.requiredUnits,
      )
    ) {
      violations.push(
        'POWER_MECHANICS_ROUSE_COUNT_INVALID',
      )
    }

    if (
      rouseCost.requiredUnits !==
        undefined &&
      rouseCost.unit !==
        'distinctNight'
    ) {
      violations.push(
        'POWER_MECHANICS_ROUSE_COUNT_INVALID',
      )
    }
  }

  if (
    rouseCost.kind === 'conditional'
  ) {
    const cases =
      rouseCost.cases

    const allowedConditions =
      new Set<string>([
        'passiveUse',
        'activeUse',
      ])

    const conditionKeys =
      Array.isArray(cases)
        ? cases.map(
            item => item.when,
          )
        : []

    const invalidChild =
      Array.isArray(cases) &&
      cases.some(
        item =>
          !(
            item.cost.kind === 'none' ||
            (
              item.cost.kind === 'fixed' &&
              positiveInteger(
                item.cost.checks,
              )
            )
          ),
      )

    if (
      !Array.isArray(cases) ||
      cases.length === 0 ||
      new Set(
        conditionKeys,
      ).size !==
        conditionKeys.length ||
      conditionKeys.some(
        condition =>
          !allowedConditions.has(
            condition,
          ),
      ) ||
      invalidChild
    ) {
      violations.push(
        'POWER_MECHANICS_ROUSE_COUNT_INVALID',
      )
    }
  }

  const rouseExemptions =
    (
      rouseCost.kind === 'fixed' ||
      rouseCost.kind === 'perUnit'
    )
      ? rouseCost.exemptions
      : undefined

  if (
    rouseExemptions !== undefined
  ) {
    const allowedRouseExemptions =
      new Set<string>([
        'targetIsFamulus',
      ])

    if (
      !Array.isArray(
        rouseExemptions,
      ) ||
      rouseExemptions.length === 0 ||
      new Set(
        rouseExemptions,
      ).size !==
        rouseExemptions.length ||
      rouseExemptions.some(
        exemption =>
          !allowedRouseExemptions.has(
            exemption,
          ),
      )
    ) {
      violations.push(
        'POWER_MECHANICS_ROUSE_COUNT_INVALID',
      )
    }
  }
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

      validateDisciplinePowerRouseCost(
        mechanics.rouseCost,
        violations,
      )

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
            'orderCompleted',
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
        duration.kind === 'hours' &&
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
          'turnsByMargin' &&
        !positiveInteger(
          duration.baseTurns,
        )
      ) {
        violations.push(
          'POWER_MECHANICS_DURATION_INVALID',
        )
      }

      if (
        duration.kind === 'minutes' &&
        duration.count !== undefined &&
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

      if (
        duration.kind === 'untilEvent'
      ) {
        const allowedEvents =
          new Set<string>([
            'targetDeath',
            'frenzyEnds',
          ])

        if (
          !allowedEvents.has(
            duration.event,
          )
        ) {
          violations.push(
            'POWER_MECHANICS_DURATION_INVALID',
          )
        }
      }

      if (
        duration.kind === 'conditional'
      ) {
        const cases =
          duration.cases

        const allowedConditions =
          new Set<string>([
            'targetIsMortal',
            'targetIsVampire',
            'targetIsWilling',
            'targetIsUnwilling',
            'informationGathering',
            'surveillance',
          ])

        const conditionKeys =
          Array.isArray(cases)
            ? cases.map(
                item => item.when,
              )
            : []

        const invalidChild =
          Array.isArray(cases) &&
          cases.some(
            item =>
              !(
                item.duration.kind ===
                  'scene' ||
                item.duration.kind ===
                  'night' ||
                (
                  item.duration.kind ===
                    'minutes' &&
                  (
                    item.duration.count ===
                      undefined ||
                    positiveInteger(
                      item.duration.count,
                    )
                  )
                ) ||
                (
                  item.duration.kind ===
                    'turnsByMargin' &&
                  positiveInteger(
                    item.duration.baseTurns,
                  )
                )
              ),
          )

        if (
          !Array.isArray(cases) ||
          cases.length === 0 ||
          new Set(
            conditionKeys,
          ).size !==
            conditionKeys.length ||
          conditionKeys.some(
            condition =>
              !allowedConditions.has(
                condition,
              ),
          ) ||
          invalidChild
        ) {
          violations.push(
            'POWER_MECHANICS_DURATION_INVALID',
          )
        }
      }

      if (
        duration.kind === 'outcomeBased'
      ) {
        const cases =
          duration.cases

        const allowedOutcomes =
          new Set<string>([
            'normalSuccess',
            'criticalSuccess',
          ])

        const outcomeKeys =
          Array.isArray(cases)
            ? cases.map(
                item => item.outcome,
              )
            : []

        const invalidChild =
          Array.isArray(cases) &&
          cases.some(
            item =>
              !(
                item.duration.kind ===
                  'scene' ||
                item.duration.kind ===
                  'indefinite'
              ),
          )

        if (
          !Array.isArray(cases) ||
          cases.length === 0 ||
          new Set(
            outcomeKeys,
          ).size !==
            outcomeKeys.length ||
          outcomeKeys.some(
            outcome =>
              !allowedOutcomes.has(
                outcome,
              ),
          ) ||
          invalidChild
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

        if (check.rouseCost) {
          validateDisciplinePowerRouseCost(
            check.rouseCost,
            violations,
          )
        }

        for (
          const limit of
          check.limits ?? []
        ) {
          if (
            !positiveInteger(
              limit.count,
            )
          ) {
            violations.push(
              'POWER_MECHANICS_LIMIT_INVALID',
            )
          }
        }

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
