import assert from 'node:assert/strict'
import test from 'node:test'

import {
  analyzeInitialAdvantageReview,
  validateInitialAdvantageReplacement,
} from '../dist/characters/domain/character-initial-advantage.rules.js'

import {
  characterRulesCatalog,
} from '../dist/characters/domain/character-rules-catalog.js'

function selection(overrides = {}) {
  return {
    selectionId: 'resources',
    definitionKey: 'resources',
    category: 'background',
    rating: 5,
    origin: 'creation',
    parentSelectionId: null,
    details: {
      kind: 'resources',
      source: 'Patrimonio',
    },
    ...overrides,
  }
}

function invalidVampire() {
  return {
    nature: 'vampire',
    identity: {
      clanKey: 'ventrue',
      generation: 13,
      ageCategory: 'neonate',
    },
    creation: {
      creationMode: 'sessionZero',
    },
    advantages: {
      selections: [
        selection(),
        selection({
          selectionId: 'contacts',
          definitionKey: 'contacts',
          rating: 2,
          details: {
            kind: 'contact',
            identity: 'Periodista',
          },
        }),
        selection({
          selectionId: 'vegan',
          definitionKey: 'vegan',
          category: 'flaw',
          rating: 2,
          details: null,
        }),
      ],
    },
  }
}

test(
  '057-E3A identifica explícitamente la selección creation inválida',
  () => {
    const review =
      analyzeInitialAdvantageReview(
        invalidVampire(),
        characterRulesCatalog,
      )

    assert.equal(review.required, true)
    assert.ok(
      review.replaceableSelectionIds.includes(
        'vegan',
      ),
    )
    assert.equal(
      review.replaceableSelectionIds.includes(
        'resources',
      ),
      false,
    )
  },
)

test(
  '057-E3A preserva Ventajas válidas y permite sustituir sólo la inválida manteniendo 7/2',
  () => {
    const current =
      invalidVampire()

    const candidate = {
      selections: [
        current.advantages.selections[0],
        current.advantages.selections[1],
        selection({
          selectionId: 'enemy',
          definitionKey: 'enemy',
          category: 'flaw',
          rating: 2,
          details: {
            kind: 'enemy',
            identity: 'Rival',
          },
        }),
      ],
    }

    assert.deepEqual(
      validateInitialAdvantageReplacement(
        current,
        candidate,
        characterRulesCatalog,
      ),
      [],
    )

    const changedValid = {
      selections: [
        {
          ...candidate.selections[0],
          rating: 4,
        },
        candidate.selections[1],
        candidate.selections[2],
      ],
    }

    assert.ok(
      validateInitialAdvantageReplacement(
        current,
        changedValid,
        characterRulesCatalog,
      ).some(
        ({ code }) =>
          code ===
          'CHARACTER_INITIAL_ADVANTAGE_VALID_SELECTION_MUST_BE_PRESERVED',
      ),
    )
  },
)


test(
  '057-E3A exige conservar exactamente el presupuesto creation 7/2',
  () => {
    const current =
      invalidVampire()

    const candidate = {
      selections: [
        current.advantages.selections[0],
        current.advantages.selections[1],
        selection({
          selectionId: 'enemy-budget',
          definitionKey: 'enemy',
          category: 'flaw',
          rating: 1,
          details: {
            kind: 'enemy',
            identity: 'Rival menor',
          },
        }),
      ],
    }

    assert.ok(
      validateInitialAdvantageReplacement(
        current,
        candidate,
        characterRulesCatalog,
      ).some(
        ({ code }) =>
          code ===
          'CHARACTER_FLAW_CREATION_BUDGET_INVALID',
      ),
    )
  },
)

test(
  '057-E3A no admite contribuciones predatorType/evolution en el presupuesto reemplazado',
  () => {
    const current =
      invalidVampire()

    const issues =
      validateInitialAdvantageReplacement(
        current,
        {
          selections: [
            current.advantages.selections[0],
            current.advantages.selections[1],
            {
              ...current.advantages.selections[2],
              origin: 'predatorType',
            },
          ],
        },
        characterRulesCatalog,
      )

    assert.ok(
      issues.some(
        ({ code }) =>
          code ===
          'CHARACTER_INITIAL_ADVANTAGE_REVIEW_CREATION_ONLY',
      ),
    )
  },
)
