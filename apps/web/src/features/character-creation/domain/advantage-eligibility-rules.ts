import type {
  CharacterAdvantageAgeCategory,
  CharacterAdvantageCharacterKind,
  CharacterAdvantageDefinition,
} from '../types/character-advantage-definition.types'
import type {
  CharacterAdvantageRequirementContext,
  CharacterAdvantageRequirementFailure,
  CharacterAdvantageRequirementSelection,
} from '../types/character-advantage-requirements.types'
import {
  evaluateCharacterAdvantageRequirements,
} from './advantage-requirement-engine.ts'

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
   * Compatibilidad con el contrato histórico.
   *
   * Cuando no se proporcionan selecciones con rating, cada clave
   * histórica se traduce temporalmente a una selección de rating 1.
   */
  selectedDefinitionKeys?: readonly string[]

  /*
   * Contexto moderno utilizado por advantage-requirement-engine.
   */
  selectedAdvantages?: readonly CharacterAdvantageRequirementSelection[]
  predatorTypeKey?: string | null
  humanity?: number
  generation?: number
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
    fledgling: 0,
    neonate: 1,
    ancilla: 2,
    elder: 3,
  }

function buildModernRequirementContext(
  context: CharacterAdvantageEligibilityContext,
): CharacterAdvantageRequirementContext {
  const selections =
    context.selectedAdvantages ??
    (context.selectedDefinitionKeys ?? []).map(
      (definitionKey) => ({
        definitionKey,
        rating: 1,
      }),
    )

  return {
    selections,
    clanKey:
      context.clanKey ?? undefined,
    predatorTypeKey:
      context.predatorTypeKey ?? undefined,
    isThinBlood:
      context.characterKind === 'thinBlood',
    humanity:
      context.humanity,
    generation:
      context.generation,
  }
}

function describeModernRequirementFailure(
  definition: CharacterAdvantageDefinition,
  failure: CharacterAdvantageRequirementFailure,
): string {
  switch (failure.code) {
    case 'missingAdvantage':
      return `La Ventaja ${definition.key} requiere la definición ${failure.requirement.type === 'advantage' ? failure.requirement.definitionKey : 'indicada'}.`

    case 'insufficientAdvantageRating':
      return `La Ventaja ${definition.key} requiere una puntuación superior en otra Ventaja.`

    case 'missingClan':
      return `La Ventaja ${definition.key} requiere que el clan esté determinado.`

    case 'clanNotAllowed':
      return `La Ventaja ${definition.key} requiere un clan permitido.`

    case 'missingPredatorType':
      return `La Ventaja ${definition.key} requiere que el tipo de depredador esté determinado.`

    case 'predatorTypeNotAllowed':
      return `La Ventaja ${definition.key} requiere un tipo de depredador permitido.`

    case 'thinBloodMismatch':
      return `La Ventaja ${definition.key} no es compatible con el estado de Sangre Débil del personaje.`

    case 'missingHumanity':
      return `La Ventaja ${definition.key} requiere que la Humanidad esté determinada.`

    case 'insufficientHumanity':
      return `La Ventaja ${definition.key} requiere una Humanidad mínima superior.`

    case 'missingGeneration':
      return `La Ventaja ${definition.key} requiere que la Generación esté determinada.`

    case 'generationTooHigh':
      return `La Ventaja ${definition.key} requiere una Generación máxima inferior.`

    default: {
      const exhaustiveCheck: never =
        failure.code

      return exhaustiveCheck
    }
  }
}

export function validateCharacterAdvantageEligibility(
  definition: CharacterAdvantageDefinition,
  context: CharacterAdvantageEligibilityContext,
): CharacterAdvantageEligibilityResult {
  const errors: string[] = []

  /*
   * Ruta moderna.
   *
   * Las nuevas definiciones pueden migrarse individualmente al motor
   * común sin modificar ni eliminar todavía el catálogo histórico.
   */
  if (
    definition.requirementRules &&
    definition.requirementRules.length > 0
  ) {
    const evaluation =
      evaluateCharacterAdvantageRequirements(
        definition.requirementRules,
        buildModernRequirementContext(
          context,
        ),
      )

    for (const failure of evaluation.failures) {
      errors.push(
        describeModernRequirementFailure(
          definition,
          failure,
        ),
      )
    }
  }

  /*
   * Ruta histórica.
   *
   * Se conserva durante la migración gradual. Si una definición
   * declara ambos contratos, ambos se evalúan con semántica AND.
   */
  const requirements =
    definition.requirements

  if (requirements) {
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
        context.selectedDefinitionKeys ??
        context.selectedAdvantages?.map(
          (selection) =>
            selection.definitionKey,
        ) ??
        [],
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
  }

  const uniqueErrors = [
    ...new Set(errors),
  ]

  return {
    eligible:
      uniqueErrors.length === 0,
    errors:
      uniqueErrors,
  }
}
