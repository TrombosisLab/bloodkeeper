import type {
  CharacterAdvantageAgeCategory,
  CharacterAdvantageCharacterKind,
  CharacterAdvantageDefinition,
} from '../types/character-advantage-definition.types'

export interface CharacterAdvantageEligibilityContext {
  characterKind:
    CharacterAdvantageCharacterKind

  clanKey: string | null

  /*
   * null significa que la categoría etaria todavía
   * no ha sido determinada en el flujo de creación.
   */
  ageCategory:
    | CharacterAdvantageAgeCategory
    | null

  /*
   * Definiciones ya adquiridas por el personaje.
   * Permite resolver requisitos entre Ventajas.
   */
  selectedDefinitionKeys?: readonly string[]
}

export interface CharacterAdvantageEligibilityResult {
  eligible: boolean
  errors: string[]
}

const AGE_CATEGORY_RANK:
  Record<
    CharacterAdvantageAgeCategory,
    number
  > = {
    neonate: 1,
    ancilla: 2,
    elder: 3,
  }

export function validateCharacterAdvantageEligibility(
  definition: CharacterAdvantageDefinition,
  context: CharacterAdvantageEligibilityContext,
): CharacterAdvantageEligibilityResult {
  const errors: string[] = []

  const requirements =
    definition.requirements

  if (!requirements) {
    return {
      eligible: true,
      errors: [],
    }
  }

  if (
    requirements.characterKinds &&
    !requirements.characterKinds.includes(
      context.characterKind,
    )
  ) {
    errors.push(
      `La Ventaja ${definition.key} no está disponible para personajes de tipo ${context.characterKind}.`,
    )
  }

  if (
    requirements.clanKeys &&
    (
      context.clanKey === null ||
      !requirements.clanKeys.includes(
        context.clanKey,
      )
    )
  ) {
    errors.push(
      `La Ventaja ${definition.key} requiere un clan permitido.`,
    )
  }

  if (
    context.clanKey !== null &&
    requirements.excludedClanKeys?.includes(
      context.clanKey,
    )
  ) {
    errors.push(
      `La Ventaja ${definition.key} excluye el clan ${context.clanKey}.`,
    )
  }

  if (
    requirements.minimumAgeCategory
  ) {
    if (context.ageCategory === null) {
      errors.push(
        `La Ventaja ${definition.key} requiere una categoría etaria conocida.`,
      )
    } else if (
      AGE_CATEGORY_RANK[
        context.ageCategory
      ] <
      AGE_CATEGORY_RANK[
        requirements.minimumAgeCategory
      ]
    ) {
      errors.push(
        `La Ventaja ${definition.key} requiere una categoría etaria mínima de ${requirements.minimumAgeCategory}.`,
      )
    }
  }

  const selectedDefinitionKeys =
    new Set(
      context.selectedDefinitionKeys ?? [],
    )

  for (
    const requiredKey of
    requirements.requiredDefinitionKeys ?? []
  ) {
    if (
      !selectedDefinitionKeys.has(
        requiredKey,
      )
    ) {
      errors.push(
        `La Ventaja ${definition.key} requiere la definición ${requiredKey}.`,
      )
    }
  }

  return {
    eligible: errors.length === 0,
    errors: [
      ...new Set(errors),
    ],
  }
}
