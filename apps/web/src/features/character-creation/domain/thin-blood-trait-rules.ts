import {
  getThinBloodTraitDefinition,
} from '../data/thin-blood-trait-definitions.ts'

import type {
  CharacterThinBloodTraitsDraft,
  ThinBloodTraitCategory,
} from '../types/thin-blood-trait.types.ts'

export const THIN_BLOOD_TRAIT_MIN_PER_CATEGORY = 1
export const THIN_BLOOD_TRAIT_MAX_PER_CATEGORY = 3

export interface ThinBloodTraitValidationResult {
  valid: boolean
  errors: string[]
}

function getSelectedDefinitions(
  draft: CharacterThinBloodTraitsDraft,
) {
  return draft.selections
    .map((selection) =>
      getThinBloodTraitDefinition(
        selection.definitionKey,
      ),
    )
    .filter(
      (definition) =>
        definition !== null,
    )
}

export function countThinBloodTraitsByCategory(
  draft: CharacterThinBloodTraitsDraft,
  category: ThinBloodTraitCategory,
): number {
  return getSelectedDefinitions(draft)
    .filter(
      (definition) =>
        definition.category === category,
    )
    .length
}

export function hasDuplicateThinBloodTraitSelections(
  draft: CharacterThinBloodTraitsDraft,
): boolean {
  const keys = draft.selections.map(
    (selection) =>
      selection.definitionKey,
  )

  return new Set(keys).size !== keys.length
}

export function hasUnknownThinBloodTraitSelections(
  draft: CharacterThinBloodTraitsDraft,
): boolean {
  return draft.selections.some(
    (selection) =>
      getThinBloodTraitDefinition(
        selection.definitionKey,
      ) === null,
  )
}

/*
 * Valida la selección completa exigida durante la creación
 * de un personaje Sangre Débil.
 *
 * Regla CORE:
 * - entre 1 y 3 Méritos de Sangre Débil;
 * - igual cantidad de Defectos de Sangre Débil.
 *
 * Los rasgos son discretos y no participan en el
 * presupuesto ordinario de Ventajas 7/2.
 */
export function validateThinBloodTraitSelection(
  draft: CharacterThinBloodTraitsDraft,
): ThinBloodTraitValidationResult {
  const errors: string[] = []

  if (
    hasUnknownThinBloodTraitSelections(
      draft,
    )
  ) {
    errors.push(
      'La selección contiene rasgos de Sangre Débil desconocidos.',
    )
  }

  if (
    hasDuplicateThinBloodTraitSelections(
      draft,
    )
  ) {
    errors.push(
      'No se puede seleccionar dos veces el mismo rasgo de Sangre Débil.',
    )
  }

  const meritCount =
    countThinBloodTraitsByCategory(
      draft,
      'merit',
    )

  const flawCount =
    countThinBloodTraitsByCategory(
      draft,
      'flaw',
    )

  if (
    meritCount <
      THIN_BLOOD_TRAIT_MIN_PER_CATEGORY ||
    meritCount >
      THIN_BLOOD_TRAIT_MAX_PER_CATEGORY
  ) {
    errors.push(
      'Un Sangre Débil debe seleccionar entre 1 y 3 Méritos de Sangre Débil.',
    )
  }

  if (flawCount !== meritCount) {
    errors.push(
      'Un Sangre Débil debe seleccionar la misma cantidad de Defectos que de Méritos de Sangre Débil.',
    )
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/*
 * Valida la aplicabilidad según el tipo de personaje.
 *
 * Para personajes que no son Sangre Débil, este subsistema
 * debe permanecer vacío.
 *
 * En Sangre Débil se exige una selección completa válida.
 */
export function validateThinBloodTraitsForCharacterKind(
  draft: CharacterThinBloodTraitsDraft,
  characterKind: string,
): ThinBloodTraitValidationResult {
  if (characterKind !== 'thinBlood') {
    if (draft.selections.length === 0) {
      return {
        valid: true,
        errors: [],
      }
    }

    return {
      valid: false,
      errors: [
        'Los Méritos y Defectos de Sangre Débil sólo pueden seleccionarse para personajes Sangre Débil.',
      ],
    }
  }

  return validateThinBloodTraitSelection(
    draft,
  )
}
