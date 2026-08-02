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

export interface DisciplinePowerCatalogValidationResult {
  valid: boolean
  violations: DisciplinePowerCatalogViolation[]
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

      const poolTerms = new Set<string>()

      for (
        const term of
        definition.diceCheck.pool
      ) {
        const termReference =
          `${term.kind}:${term.key}`

        if (
          poolTerms.has(termReference)
        ) {
          violations.push(
            'POWER_DICE_POOL_TERM_DUPLICATED',
          )
        }

        poolTerms.add(termReference)
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations: [...new Set(violations)],
  }
}
