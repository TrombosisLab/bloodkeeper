import type {
  DisciplineDefinition,
  DisciplineKey,
} from '../types/discipline.types.ts'

export type DisciplineCatalogViolation =
  | 'DISCIPLINE_KEY_DUPLICATED'
  | 'DISCIPLINE_NAME_EMPTY'
  | 'DISCIPLINE_ACTIVE_STATE_INVALID'

export interface DisciplineCatalogValidationResult {
  valid: boolean
  violations: DisciplineCatalogViolation[]
}

export function validateDisciplineCatalog(
  definitions:
    readonly DisciplineDefinition[],
): DisciplineCatalogValidationResult {
  const violations:
    DisciplineCatalogViolation[] = []
  const keys = new Set<DisciplineKey>()

  for (const definition of definitions) {
    if (keys.has(definition.key)) {
      violations.push(
        'DISCIPLINE_KEY_DUPLICATED',
      )
    }

    keys.add(definition.key)

    if (definition.name.trim().length === 0) {
      violations.push(
        'DISCIPLINE_NAME_EMPTY',
      )
    }

    if (typeof definition.active !== 'boolean') {
      violations.push(
        'DISCIPLINE_ACTIVE_STATE_INVALID',
      )
    }
  }

  return {
    valid: violations.length === 0,
    violations: [...new Set(violations)],
  }
}

export function isDisciplineActive(
  definitions:
    readonly DisciplineDefinition[],
  key: DisciplineKey,
): boolean {
  return definitions.some(
    (definition) =>
      definition.key === key &&
      definition.active,
  )
}

export function filterActiveDisciplineKeys(
  definitions:
    readonly DisciplineDefinition[],
  keys: readonly DisciplineKey[],
): DisciplineKey[] {
  return keys.filter((key) =>
    isDisciplineActive(definitions, key),
  )
}
