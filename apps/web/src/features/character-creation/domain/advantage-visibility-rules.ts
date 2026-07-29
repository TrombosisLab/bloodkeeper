import type {
  CharacterAdvantageDefinition,
} from '../types/character-advantage-definition.types'

import type {
  CharacterAdvantagesDraft,
} from '../types/character-advantages-draft.types'

import {
  validateCharacterAdvantageEligibility,
} from './advantage-eligibility-rules'

export function canShowAdvantageDefinition(
  definition: CharacterAdvantageDefinition,
  draft: CharacterAdvantagesDraft,
  context?: {
    clanKey?: string | null
    generation?: number | null
    characterKind?: 'standard' | 'caitiff' | 'thinBlood'
    ageCategory?: 'neonate' | 'ancilla' | 'elder' | null
  },
): boolean {

  if (
    definition.requiresParentSelection === true
  ) {
    const hasParent =
      draft.selections.some(
        (selection) =>
          definition.allowedParentDefinitionKeys?.includes(
            selection.definitionKey,
          ),
      )

    if (!hasParent) {
      return false
    }
  }

  if (
    definition.requirementRules &&
    definition.requirementRules.length > 0
  ) {
    const result =
      validateCharacterAdvantageEligibility(
        definition,
        {
          characterKind:
            context?.characterKind ?? 'standard',
          clanKey:
            context?.clanKey ?? null,
          ageCategory:
            context?.ageCategory ?? null,
          selectedAdvantages:
            draft.selections.map(
              (selection) => ({
                definitionKey:
                  selection.definitionKey,
                rating:
                  selection.rating,
              }),
            ),
          generation:
            context?.generation ?? undefined,
          humanity: undefined,
          predatorTypeKey: undefined,
        },
      )

    return result.eligible
  }

  return true
}
