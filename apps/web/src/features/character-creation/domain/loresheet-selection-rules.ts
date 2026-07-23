import type {
  CharacterAdvantageSelectionDraft,
} from '../types/character-advantages-draft.types'

import type {
  CharacterLoresheetDefinition,
} from '../types/character-loresheet-definition.types'

export interface CharacterLoresheetSelectionValidationResult {
  valid: boolean
  errors: string[]
}

export function validateCharacterLoresheetSelections(
  selections:
    readonly CharacterAdvantageSelectionDraft[],
  definitions:
    readonly CharacterLoresheetDefinition[],
): CharacterLoresheetSelectionValidationResult {
  const errors: string[] = []

  const definitionsByKey =
    new Map(
      definitions.map(
        (definition) => [
          definition.key,
          definition,
        ],
      ),
    )

  const selectedBenefits =
    new Set<string>()

  for (const selection of selections) {
    if (
      selection.details?.kind !==
      'loresheet'
    ) {
      continue
    }

    const {
      loresheetKey,
      benefitKey,
    } = selection.details

    const definition =
      definitionsByKey.get(
        loresheetKey,
      )

    if (!definition) {
      errors.push(
        `La selección ${selection.selectionId} referencia una Ficha de Conocimientos inexistente: ${loresheetKey}.`,
      )

      continue
    }

    const benefit =
      definition.benefits.find(
        (candidate) =>
          candidate.key ===
          benefitKey,
      )

    if (!benefit) {
      errors.push(
        `La selección ${selection.selectionId} referencia una ventaja inexistente en la Ficha de Conocimientos ${loresheetKey}: ${benefitKey}.`,
      )

      continue
    }

    if (
      selection.rating !==
      benefit.level
    ) {
      errors.push(
        `La puntuación de ${selection.selectionId} debe coincidir con el nivel ${benefit.level} de la ventaja ${benefitKey}.`,
      )
    }

    const uniqueBenefitKey =
      `${loresheetKey}:${benefitKey}`

    if (
      selectedBenefits.has(
        uniqueBenefitKey,
      )
    ) {
      errors.push(
        `La ventaja ${benefitKey} de la Ficha de Conocimientos ${loresheetKey} está seleccionada más de una vez.`,
      )
    }

    selectedBenefits.add(
      uniqueBenefitKey,
    )
  }

  return {
    valid: errors.length === 0,
    errors: [
      ...new Set(errors),
    ],
  }
}
