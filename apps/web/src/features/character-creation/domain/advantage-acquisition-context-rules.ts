import type {
  CharacterAdvantagesDraft,
} from '../types/character-advantages-draft.types.ts'

import {
  validateCharacterAdvantagesStructure,
  validateInitialCharacterAdvantagesBudget,
} from './advantage-rules.ts'

export type CharacterAdvantageAcquisitionContext =
  | 'characterCreation'
  | 'characterAdvancement'

export interface CharacterAdvantageContextValidationResult {
  context:
    CharacterAdvantageAcquisitionContext

  structurallyValid: boolean

  valid: boolean

  errors: string[]
}

export const ADVANTAGE_ADVANCEMENT_RULES_REQUIRED =
  'La adquisición, mejora o eliminación posterior requiere reglas de evolución específicas antes de autorizarse.'

/*
 * Mantiene el presupuesto inicial dentro de su
 * contexto. La evolución conserva el contrato
 * estructural, pero no reutiliza 7/2 ni inventa
 * costes de Experiencia.
 */
export function validateCharacterAdvantagesForContext(
  draft:
    CharacterAdvantagesDraft,
  context:
    CharacterAdvantageAcquisitionContext,
): CharacterAdvantageContextValidationResult {
  const structural =
    validateCharacterAdvantagesStructure(
      draft,
    )

  if (
    context ===
    'characterCreation'
  ) {
    const creation =
      validateInitialCharacterAdvantagesBudget(
        draft,
      )

    return {
      context,
      structurallyValid:
        structural.valid,
      valid: creation.valid,
      errors: creation.errors,
    }
  }

  return {
    context,
    structurallyValid:
      structural.valid,
    valid: false,
    errors: [
      ...structural.errors,
      ADVANTAGE_ADVANCEMENT_RULES_REQUIRED,
    ],
  }
}
