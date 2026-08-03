import assert from 'node:assert/strict'
import test from 'node:test'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  buildStepValidationMap,
  validateStep,
} from '../src/features/character-creation/domain/step-validation.ts'

function draftWithBudget(
  advantagePoints,
  flawPoints,
) {
  const advantageSelections =
    [
      {
        selectionId:
          'background-budget-status',
        definitionKey:
          'status',
        category: 'background',
        rating:
          Math.min(
            advantagePoints,
            5,
          ),
        origin: 'creation',
        details: {
          kind: 'status',
        },
      },
      ...(advantagePoints > 5
        ? [
            {
              selectionId:
                'background-budget-contacts',
              definitionKey:
                'contacts',
              category:
                'background',
              rating:
                advantagePoints - 5,
              origin:
                'creation',
              details: {
                kind: 'contact',
              },
            },
          ]
        : []),
    ]

  const flawSelections =
    flawPoints > 0
      ? [{
        selectionId:
          'flaw-budget-enemy',
        definitionKey:
          'enemy',
        category: 'flaw',
        rating: flawPoints,
        origin: 'creation',
        details: {
          kind: 'enemy',
        },
      }]
      : []

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
  'advantages rechaza un estado 7/2 que no existe en el catálogo',
  () => {
    const draft =
      draftWithBudget(7, 2)

    draft.advantages.selections[0]
      .definitionKey =
      'unknown-background'

    const result =
      validateStep(
        'advantages',
        draft,
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.match(
      result.errors.join('\n'),
      /definici.n inexistente/,
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
