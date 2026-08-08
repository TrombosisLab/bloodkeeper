import {
  createInitialAdvantageInstanceDetails,
} from './advantage-instance-details-rules.ts'

import {
  resolvePredatorTypePointDistributionDefinitions,
  resolvePredatorTypePointDistributionOptionDefinitions,
  resolvePredatorTypePointDistributions,
  validatePredatorTypePointDistributionAllocation,
} from './predator-type-rules.ts'

import type {
  CharacterAdvantageDefinition,
} from '../types/character-advantage-definition.types.ts'

import type {
  CharacterAdvantageSelectionDraft,
  CharacterAdvantagesDraft,
} from '../types/character-advantages-draft.types.ts'

import type {
  PredatorTypePointDistributionAllocation,
  PredatorTypePointDistributionGrant,
} from '../types/predator-type.types.ts'

type PredatorTypeChoiceSelections =
  Record<string, number>

function createDistributionSelectionId(
  predatorTypeKey: string,
  distributionIndex: number,
  definitionKey: string,
): string {
  return [
    'predatorType',
    predatorTypeKey,
    'distribution',
    distributionIndex,
    definitionKey,
  ].join(':')
}

function getDistributionSelectionPrefix(
  predatorTypeKey: string,
): string {
  return [
    'predatorType',
    predatorTypeKey,
    'distribution',
    '',
  ].join(':')
}

function findDefinition(
  distribution: PredatorTypePointDistributionGrant,
  definitionKey: string,
): CharacterAdvantageDefinition | undefined {
  return resolvePredatorTypePointDistributionDefinitions(
    distribution,
  ).find(
    definition =>
      definition.key ===
      definitionKey,
  )
}

export function getPredatorTypePointDistributionAllowedRatings(
  distribution: PredatorTypePointDistributionGrant,
  definitionKey: string,
): number[] {
  const definition =
    findDefinition(
      distribution,
      definitionKey,
    )

  if (definition === undefined) {
    return []
  }

  const matchingOptions =
    distribution.options.filter(
      option =>
        resolvePredatorTypePointDistributionOptionDefinitions(
          option,
        ).some(
          candidate =>
            candidate.key ===
            definitionKey,
        ),
    )

  return definition.allowedRatings.filter(
    rating =>
      rating <= distribution.points &&
      matchingOptions.some(
        option =>
          option.maximumRating ===
            undefined ||
          rating <=
            option.maximumRating,
      ),
  )
}

export function isPredatorTypePointDistributionSelection(
  selection: CharacterAdvantageSelectionDraft,
  predatorTypeKey?: string,
): boolean {
  if (
    selection.origin !==
    'predatorType'
  ) {
    return false
  }

  const prefix =
    predatorTypeKey === undefined
      ? 'predatorType:'
      : getDistributionSelectionPrefix(
          predatorTypeKey,
        )

  if (
    !selection.selectionId.startsWith(
      prefix,
    )
  ) {
    return false
  }

  return selection.selectionId.includes(
    ':distribution:',
  )
}

export function getPredatorTypePointDistributionSelections(
  predatorTypeKey: string,
  advantages: CharacterAdvantagesDraft,
): CharacterAdvantageSelectionDraft[] {
  if (predatorTypeKey === '') {
    return []
  }

  return advantages.selections.filter(
    selection =>
      isPredatorTypePointDistributionSelection(
        selection,
        predatorTypeKey,
      ),
  )
}

export function getPredatorTypePointDistributionAllocations(
  predatorTypeKey: string,
  distributionIndex: number,
  advantages: CharacterAdvantagesDraft,
): PredatorTypePointDistributionAllocation[] {
  const distributions =
    resolvePredatorTypePointDistributions(
      predatorTypeKey,
    )

  const distribution =
    distributions[
      distributionIndex
    ]

  if (distribution === undefined) {
    return []
  }

  return resolvePredatorTypePointDistributionDefinitions(
    distribution,
  ).flatMap(
    definition => {
      const selectionId =
        createDistributionSelectionId(
          predatorTypeKey,
          distributionIndex,
          definition.key,
        )

      const selection =
        advantages.selections.find(
          candidate =>
            candidate.selectionId ===
              selectionId &&
            candidate.origin ===
              'predatorType',
        )

      if (selection === undefined) {
        return []
      }

      return [
        {
          definitionKey:
            definition.key,
          rating:
            selection.rating,
        },
      ]
    },
  )
}

export function updatePredatorTypePointDistributionSelection(
  predatorTypeKey: string,
  distributionIndex: number,
  definitionKey: string,
  rating: number,
  choiceSelections: PredatorTypeChoiceSelections,
  advantages: CharacterAdvantagesDraft,
): CharacterAdvantagesDraft {
  const distributions =
    resolvePredatorTypePointDistributions(
      predatorTypeKey,
      {},
      choiceSelections,
    )

  const distribution =
    distributions[
      distributionIndex
    ]

  if (distribution === undefined) {
    return advantages
  }

  const definition =
    findDefinition(
      distribution,
      definitionKey,
    )

  if (definition === undefined) {
    return advantages
  }

  const selectionId =
    createDistributionSelectionId(
      predatorTypeKey,
      distributionIndex,
      definitionKey,
    )

  const existing =
    advantages.selections.find(
      selection =>
        selection.selectionId ===
        selectionId,
    )

  const remaining =
    advantages.selections.filter(
      selection =>
        selection.selectionId !==
        selectionId,
    )

  if (rating === 0) {
    return {
      selections: remaining,
    }
  }

  const allowedRatings =
    getPredatorTypePointDistributionAllowedRatings(
      distribution,
      definitionKey,
    )

  if (!allowedRatings.includes(rating)) {
    return advantages
  }

  const initialDetails =
    createInitialAdvantageInstanceDetails(
      definition,
    )

  const selection:
    CharacterAdvantageSelectionDraft = {
      selectionId,
      definitionKey,
      category:
        definition.category,
      rating,
      origin: 'predatorType',

      ...(existing?.details ===
      undefined
        ? initialDetails ===
          undefined
          ? {}
          : {
              details:
                initialDetails,
            }
        : {
            details:
              existing.details,
          }),
    }

  return {
    selections: [
      ...remaining,
      selection,
    ],
  }
}

export function restorePredatorTypePointDistributionSelections(
  predatorTypeKey: string,
  choiceSelections: PredatorTypeChoiceSelections,
  preservedSelections:
    readonly CharacterAdvantageSelectionDraft[],
  advantages: CharacterAdvantagesDraft,
): CharacterAdvantagesDraft {
  if (
    predatorTypeKey === '' ||
    preservedSelections.length === 0
  ) {
    return advantages
  }

  const distributions =
    resolvePredatorTypePointDistributions(
      predatorTypeKey,
      {},
      choiceSelections,
    )

  const legal =
    preservedSelections.filter(
      selection => {
        for (
          let distributionIndex = 0;
          distributionIndex <
          distributions.length;
          distributionIndex += 1
        ) {
          const distribution =
            distributions[
              distributionIndex
            ]

          const expectedId =
            createDistributionSelectionId(
              predatorTypeKey,
              distributionIndex,
              selection.definitionKey,
            )

          if (
            selection.selectionId !==
            expectedId
          ) {
            continue
          }

          return getPredatorTypePointDistributionAllowedRatings(
            distribution,
            selection.definitionKey,
          ).includes(
            selection.rating,
          )
        }

        return false
      },
    )

  const restoredIds =
    new Set(
      legal.map(
        selection =>
          selection.selectionId,
      ),
    )

  return {
    selections: [
      ...advantages.selections.filter(
        selection =>
          !restoredIds.has(
            selection.selectionId,
          ),
      ),
      ...legal,
    ],
  }
}

export interface PredatorTypePointDistributionDraftValidation {
  valid: boolean
  errors: string[]
}

export function validatePredatorTypePointDistributionDraft(
  predatorTypeKey: string,
  choiceSelections: PredatorTypeChoiceSelections,
  advantages: CharacterAdvantagesDraft,
): PredatorTypePointDistributionDraftValidation {
  if (predatorTypeKey === '') {
    return {
      valid: true,
      errors: [],
    }
  }

  const errors: string[] = []

  resolvePredatorTypePointDistributions(
    predatorTypeKey,
    {},
    choiceSelections,
  ).forEach(
    (
      distribution,
      distributionIndex,
    ) => {
      const allocations =
        getPredatorTypePointDistributionAllocations(
          predatorTypeKey,
          distributionIndex,
          advantages,
        )

      const validation =
        validatePredatorTypePointDistributionAllocation(
          distribution,
          allocations,
        )

      errors.push(
        ...validation.errors.map(
          error =>
            `Reparto ${
              distributionIndex + 1
            } del Tipo de Depredador: ${error}`,
        ),
      )
    },
  )

  return {
    valid:
      errors.length === 0,
    errors,
  }
}
