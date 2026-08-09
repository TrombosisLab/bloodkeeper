import {
  characterAdvantageDefinitions,
} from '../data/character-advantage-definitions.ts'

import {
  validateCharacterAdvantageSelectionsAgainstDefinitions,
} from './advantage-definition-rules.ts'

import {
  validateCharacterAdvantageEligibility,
} from './advantage-eligibility-rules.ts'

import {
  characterCoreLoresheetDefinitions,
} from '../data/core-loresheet-definitions.ts'

import {
  validateCharacterLoresheetSelections,
} from './loresheet-selection-rules.ts'

import {
  validateCharacterLoresheetEligibility,
} from './loresheet-eligibility-rules.ts'

import type {
  CharacterAdvantageDefinition,
} from '../types/character-advantage-definition.types.ts'

import type {
  CharacterDraft,
} from '../types/character-draft.types.ts'

import type {
  CharacterAdvantageEligibilityContext,
} from './advantage-eligibility-rules.ts'

export interface CharacterAdvantageRegulatoryValidationResult {
  valid: boolean
  errors: string[]
}

export function buildCharacterAdvantageEligibilityContext(
  draft: CharacterDraft,
): CharacterAdvantageEligibilityContext {
  const characterKind =
    draft.identity.clan === 'thinBlood'
      ? 'thinBlood'
      : draft.identity.clan === 'caitiff'
        ? 'caitiff'
        : 'standard'

  return {
    characterKind,
    clanKey:
      draft.identity.clan,

    ageCategory:
      draft.identity.ageCategory,

    selectedAdvantages:
      draft.advantages.selections.map(
        (selection) => ({
          definitionKey:
            selection.definitionKey,
          rating:
            selection.rating,
        }),
      ),

    predatorTypeKey:
      draft.identity.predatorType || null,

    humanity:
      draft.humanity.value,

    generation:
      draft.identity.generation ?? undefined,
  }
}

export function validateCharacterAdvantageRegulatoryState(
  draft: CharacterDraft,
  definitions: readonly CharacterAdvantageDefinition[] =
    characterAdvantageDefinitions,
): CharacterAdvantageRegulatoryValidationResult {
  const definitionValidation =
    validateCharacterAdvantageSelectionsAgainstDefinitions(
      draft.advantages,
      definitions,
    )

  const definitionsByKey =
    new Map(
      definitions.map(
        (definition) => [
          definition.key,
          definition,
        ] as const),
    )

  const context =
    buildCharacterAdvantageEligibilityContext(
      draft,
    )

  const eligibilityErrors: string[] = []
  const checkedDefinitionKeys =
    new Set<string>()

  for (
    const selection of
    draft.advantages.selections
  ) {
    if (
      checkedDefinitionKeys.has(
        selection.definitionKey,
      )
    ) {
      continue
    }

    checkedDefinitionKeys.add(
      selection.definitionKey,
    )

    const definition =
      definitionsByKey.get(
        selection.definitionKey,
      )

    if (!definition) {
      continue
    }

    const eligibility =
      validateCharacterAdvantageEligibility(
        definition,
        context,
      )

    eligibilityErrors.push(
      ...eligibility.errors,
    )
  }

  const loresheetSelectionValidation =
    validateCharacterLoresheetSelections(
      draft.advantages.selections,
      characterCoreLoresheetDefinitions,
    )

  const loresheetDefinitionsByKey =
    new Map(
      characterCoreLoresheetDefinitions.map(
        (definition) => [
          definition.key,
          definition,
        ] as const),
    )

  const selectedLoresheetKeys =
    new Set(
      draft.advantages.selections
        .filter(
          (selection) =>
            selection.details?.kind ===
            'loresheet',
        )
        .map(
          (selection) =>
            selection.details?.kind ===
            'loresheet'
              ? selection.details.loresheetKey
              : '',
        )
        .filter(Boolean),
    )

  const loresheetEligibilityErrors:
    string[] = []

  for (
    const loresheetKey of
    selectedLoresheetKeys
  ) {
    const loresheet =
      loresheetDefinitionsByKey.get(
        loresheetKey,
      )

    if (!loresheet) {
      continue
    }

    const eligibility =
      validateCharacterLoresheetEligibility(
        loresheet,
        {
          characterKind:
            context.characterKind,
          clanKey:
            context.clanKey,
        },
      )

    loresheetEligibilityErrors.push(
      ...eligibility.errors,
    )
  }

  const errors = [
    ...new Set([
      ...definitionValidation.errors,
      ...eligibilityErrors,
      ...loresheetSelectionValidation.errors,
      ...loresheetEligibilityErrors,
    ]),
  ]

  return {
    valid: errors.length === 0,
    errors,
  }
}
