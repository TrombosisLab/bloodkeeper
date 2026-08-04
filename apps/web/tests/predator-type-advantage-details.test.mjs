import assert from 'node:assert/strict'
import test from 'node:test'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  getCharacterAdvantagesBudget,
} from '../src/features/character-creation/domain/advantage-rules.ts'

import {
  applyCharacterDraftUpdate,
} from '../src/features/character-creation/domain/blood-sorcery-ritual-draft-rules.ts'

import {
  validateStep,
} from '../src/features/character-creation/domain/step-validation.ts'

function selectBagger() {
  return applyCharacterDraftUpdate(
    structuredClone(
      initialCharacterDraft,
    ),
    (current) => ({
      ...current,
      identity: {
        ...current.identity,
        name: 'Prueba',
        concept: 'Concepto',
        clan: 'brujah',
        generation: 13,
        predatorType: 'bagger',
      },
      predatorTypeChoices: {
        'bagger-specialty': 0,
      },
    }),
  )
}

function completeStandardBudget(
  draft,
) {
  return applyCharacterDraftUpdate(
    draft,
    (current) => ({
      ...current,
      advantages: {
        selections: [
          ...current.advantages.selections,
          {
            selectionId:
              'creation-status',
            definitionKey:
              'status',
            category:
              'background',
            rating: 5,
            origin:
              'creation',
            details: {
              kind: 'status',
            },
          },
          {
            selectionId:
              'creation-contacts',
            definitionKey:
              'contacts',
            category:
              'background',
            rating: 2,
            origin:
              'creation',
            details: {
              kind: 'contact',
            },
          },
          {
            selectionId:
              'creation-repulsive',
            definitionKey:
              'repulsive',
            category:
              'flaw',
            rating: 2,
            origin:
              'creation',
          },
        ],
      },
    }),
  )
}

test(
  '003-J inicializa details en concesiones Predator Type complejas',
  () => {
    const draft =
      selectBagger()

    const enemy =
      draft.advantages.selections.find(
        (selection) =>
          selection.origin ===
            'predatorType' &&
          selection.definitionKey ===
            'enemy',
      )

    assert.ok(enemy)
    assert.deepEqual(
      enemy.details,
      {
        kind: 'enemy',
      },
    )

    assert.deepEqual(
      getCharacterAdvantagesBudget(
        draft.advantages,
      ),
      {
        advantagePoints: 0,
        flawPoints: 0,
      },
    )

    const completed =
      completeStandardBudget(
        draft,
      )

    const validation =
      validateStep(
        'advantages',
        completed,
      )

    assert.deepEqual(
      validation.errors,
      [],
    )
    assert.equal(
      validation.valid,
      true,
    )
  },
)

test(
  '003-J conserva details al renormalizar la misma concesión',
  () => {
    const draft =
      selectBagger()

    const enemy =
      draft.advantages.selections.find(
        (selection) =>
          selection.origin ===
            'predatorType' &&
          selection.definitionKey ===
            'enemy',
      )

    assert.ok(enemy)

    const configured = {
      ...draft,
      advantages: {
        selections:
          draft.advantages.selections.map(
            (selection) =>
              selection.selectionId ===
              enemy.selectionId
                ? {
                    ...selection,
                    details: {
                      kind: 'enemy',
                      identity:
                        'Rival persistente',
                    },
                  }
                : selection,
          ),
      },
    }

    const normalized =
      applyCharacterDraftUpdate(
        configured,
        (current) => current,
      )

    const preserved =
      normalized.advantages.selections.find(
        (selection) =>
          selection.selectionId ===
          enemy.selectionId,
      )

    assert.deepEqual(
      preserved?.details,
      {
        kind: 'enemy',
        identity:
          'Rival persistente',
      },
    )
  },
)
