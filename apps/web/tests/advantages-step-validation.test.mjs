import assert from 'node:assert/strict'
import test from 'node:test'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  buildStepValidationMap,
  validateStep,
} from '../src/features/character-creation/domain/step-validation.ts'

function splitIntoValidRatings(
  total,
) {
  const ratings = []
  let remaining = total

  while (remaining > 0) {
    const rating =
      Math.min(remaining, 4)

    ratings.push(rating)
    remaining -= rating
  }

  return ratings
}

function draftWithBudget(
  advantagePoints,
  flawPoints,
) {
  const advantageSelections =
    splitIntoValidRatings(
      advantagePoints,
    ).map(
      (rating, index) => ({
        selectionId:
          `merit-budget-${index}`,
        definitionKey:
          `test-merit-${index}`,
        category: 'merit',
        rating,
        origin: 'creation',
      }),
    )

  const flawSelections =
    splitIntoValidRatings(
      flawPoints,
    ).map(
      (rating, index) => ({
        selectionId:
          `flaw-budget-${index}`,
        definitionKey:
          `test-flaw-${index}`,
        category: 'flaw',
        rating,
        origin: 'creation',
      }),
    )

  return {
    ...initialCharacterDraft,
    advantages: {
      selections: [
        ...advantageSelections,
        ...flawSelections,
      ],
    },
  }
}

test(
  'advantages queda incompleto con 6/2',
  () => {
    const result =
      validateStep(
        'advantages',
        draftWithBudget(6, 2),
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'advantages queda incompleto con 7/1',
  () => {
    const result =
      validateStep(
        'advantages',
        draftWithBudget(7, 1),
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'advantages acepta exactamente 7/2 a nivel de presupuesto',
  () => {
    const result =
      validateStep(
        'advantages',
        draftWithBudget(7, 2),
      )

    assert.equal(
      result.valid,
      true,
    )
  },
)

test(
  'advantages rechaza exceso 8/2',
  () => {
    const result =
      validateStep(
        'advantages',
        draftWithBudget(8, 2),
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'advantages rechaza exceso 7/3',
  () => {
    const result =
      validateStep(
        'advantages',
        draftWithBudget(7, 3),
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)

test(
  'buildStepValidationMap propaga el estado inválido de advantages',
  () => {
    const validations =
      buildStepValidationMap(
        draftWithBudget(8, 5),
      )

    assert.equal(
      validations.advantages.valid,
      false,
    )

    assert.equal(
      validations.advantages.errors.length >= 2,
      true,
    )
  },
)
