import type {
  CharacterAdvantageCharacterKind,
} from '../types/character-advantage-definition.types'

import type {
  CharacterLoresheetDefinition,
} from '../types/character-loresheet-definition.types'

export interface CharacterLoresheetEligibilityContext {
  characterKind:
    CharacterAdvantageCharacterKind

  /*
   * null representa un personaje que todavía
   * no tiene clan definido.
   */
  clanKey: string | null
}

export interface CharacterLoresheetEligibilityResult {
  eligible: boolean
  errors: string[]
}

export function validateCharacterLoresheetEligibility(
  definition: CharacterLoresheetDefinition,
  context: CharacterLoresheetEligibilityContext,
): CharacterLoresheetEligibilityResult {
  const errors: string[] = []

  const requirements =
    definition.requirements

  if (!requirements) {
    return {
      eligible: true,
      errors: [],
    }
  }

  const allowedCharacterKinds =
    requirements.characterKinds

  if (
    allowedCharacterKinds &&
    !allowedCharacterKinds.includes(
      context.characterKind,
    )
  ) {
    errors.push(
      `La Ficha de Conocimientos ${definition.key} no está disponible para personajes de tipo ${context.characterKind}.`,
    )
  }

  const allowedClanKeys =
    requirements.clanKeys

  if (
    allowedClanKeys &&
    (
      context.clanKey === null ||
      !allowedClanKeys.includes(
        context.clanKey,
      )
    )
  ) {
    errors.push(
      `La Ficha de Conocimientos ${definition.key} requiere un clan permitido.`,
    )
  }

  const excludedClanKeys =
    requirements.excludedClanKeys

  if (
    context.clanKey !== null &&
    excludedClanKeys?.includes(
      context.clanKey,
    )
  ) {
    errors.push(
      `La Ficha de Conocimientos ${definition.key} excluye el clan ${context.clanKey}.`,
    )
  }

  return {
    eligible: errors.length === 0,
    errors: [
      ...new Set(errors),
    ],
  }
}
