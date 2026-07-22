import type {
  CharacterAdvantageSelectionDraft,
  CharacterAdvantagesDraft,
} from '../types/character-advantages-draft.types.ts'

export const INITIAL_ADVANTAGE_POINTS = 7
export const INITIAL_FLAW_POINTS = 2

export interface CharacterAdvantagesBudget {
  advantagePoints: number
  flawPoints: number
}

export interface CharacterAdvantagesValidationResult {
  valid: boolean
  errors: string[]
}

export function createEmptyCharacterAdvantages():
  CharacterAdvantagesDraft {
  return {
    selections: [],
  }
}

export function countsTowardStandardAdvantageBudget(
  selection: CharacterAdvantageSelectionDraft,
): boolean {
  return selection.origin === 'creation'
}

export function getCharacterAdvantagesBudget(
  value: CharacterAdvantagesDraft,
): CharacterAdvantagesBudget {
  let advantagePoints = 0
  let flawPoints = 0

  for (const selection of value.selections) {
    if (
      !countsTowardStandardAdvantageBudget(
        selection,
      )
    ) {
      continue
    }

    if (
      selection.category === 'merit' ||
      selection.category === 'background'
    ) {
      advantagePoints += selection.rating
    }

    if (selection.category === 'flaw') {
      flawPoints += selection.rating
    }
  }

  return {
    advantagePoints,
    flawPoints,
  }
}

export function validateCharacterAdvantagesStructure(
  value: CharacterAdvantagesDraft,
): CharacterAdvantagesValidationResult {
  const errors: string[] = []

  const selectionIds =
    value.selections.map(
      (selection) =>
        selection.selectionId,
    )

  if (
    new Set(selectionIds).size !==
    selectionIds.length
  ) {
    errors.push(
      'Las selecciones de Ventajas y Defectos deben tener identificadores únicos.',
    )
  }

  for (const selection of value.selections) {
    if (!selection.selectionId.trim()) {
      errors.push(
        'Toda selección debe tener un identificador.',
      )
    }

    if (!selection.definitionKey.trim()) {
      errors.push(
        'Toda selección debe referenciar una definición.',
      )
    }

    if (
      !Number.isInteger(
        selection.rating,
      ) ||
      selection.rating < 1 ||
      selection.rating > 5
    ) {
      errors.push(
        'La puntuación de una Ventaja, Trasfondo o Defecto debe ser un entero entre 1 y 5.',
      )
    }
  }

  return {
    valid: errors.length === 0,
    errors: [
      ...new Set(errors),
    ],
  }
}

export function validateInitialCharacterAdvantagesBudget(
  value: CharacterAdvantagesDraft,
): CharacterAdvantagesValidationResult {
  const structural =
    validateCharacterAdvantagesStructure(
      value,
    )

  const errors = [
    ...structural.errors,
  ]

  const budget =
    getCharacterAdvantagesBudget(
      value,
    )

  if (
    budget.advantagePoints !==
    INITIAL_ADVANTAGE_POINTS
  ) {
    errors.push(
      `Debes asignar exactamente ${INITIAL_ADVANTAGE_POINTS} puntos entre Méritos y Trasfondos del presupuesto normal de creación.`,
    )
  }

  if (
    budget.flawPoints !==
    INITIAL_FLAW_POINTS
  ) {
    errors.push(
      `Debes seleccionar exactamente ${INITIAL_FLAW_POINTS} puntos de Defectos del presupuesto normal de creación.`,
    )
  }

  return {
    valid: errors.length === 0,
    errors: [
      ...new Set(errors),
    ],
  }
}
