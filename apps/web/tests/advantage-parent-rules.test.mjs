import assert from 'node:assert/strict'
import test from 'node:test'

import {
  validateStep,
} from '../src/features/character-creation/domain/step-validation.ts'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'


function draftWithAdvantages(
  selections,
) {
  return {
    ...initialCharacterDraft,
    advantages: {
      selections,
    },
  }
}


test(
  'Biblioteca sin Refugio falla por falta de padre',
  () => {
    const draft =
      draftWithAdvantages([
        {
          selectionId:
            'haven-library-1',
          definitionKey:
            'haven-library',
          category:
            'merit',
          rating:
            1,
          origin:
            'creation',
        },
      ])

    console.log(
      JSON.stringify(
        draft.advantages.selections,
        null,
        2,
      ),
    )

    const result =
      validateStep(
        'advantages',
        draft,
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.ok(
      result.errors.some(
        (error) =>
          error.includes(
            'Biblioteca necesita una selección padre',
          ),
      ),
    )
  },
)


test(
  'Biblioteca con Refugio válido supera la validación',
  () => {
    const draft =
      draftWithAdvantages([
        {
          selectionId:
            'haven-1',
          definitionKey:
            'haven',
          category:
            'background',
          rating:
            2,
          origin:
            'creation',
          details: {
            kind: 'haven',
          },
        },
        {
          selectionId:
            'haven-library-1',
          definitionKey:
            'haven-library',
          category:
            'merit',
          rating:
            1,
          origin:
            'creation',
          parentSelectionId:
            'haven-1',
        },
        {
          selectionId:
            'status-1',
          definitionKey:
            'status',
          category:
            'background',
          rating:
            4,
          origin:
            'creation',
          details: {
            kind: 'status',
          },
        },
        {
          selectionId:
            'illiterate-1',
          definitionKey:
            'illiterate',
          category:
            'flaw',
          rating:
            2,
          origin:
            'creation',
        },
      ])

    console.log(
      JSON.stringify(
        draft.advantages.selections,
        null,
        2,
      ),
    )

    const result =
      validateStep(
        'advantages',
        draft,
      )


    assert.equal(
      result.valid,
      true,
    )
  },
)


test(
  'Celda con Refugio nivel 1 falla',
  () => {
    const draft =
      draftWithAdvantages([
        {
          selectionId:
            'haven-1',
          definitionKey:
            'haven',
          category:
            'background',
          rating:
            1,
          origin:
            'creation',
        },
        {
          selectionId:
            'haven-cell-1',
          definitionKey:
            'haven-cell',
          category:
            'merit',
          rating:
            1,
          origin:
            'creation',
          parentSelectionId:
            'haven-1',
        },
        {
          selectionId:
            'status-1',
          definitionKey:
            'status',
          category:
            'background',
          rating:
            4,
          origin:
            'creation',
          details: {
            kind: 'status',
          },
        },
        {
          selectionId:
            'illiterate-1',
          definitionKey:
            'illiterate',
          category:
            'flaw',
          rating:
            2,
          origin:
            'creation',
        },
      ])

    console.log(
      JSON.stringify(
        draft.advantages.selections,
        null,
        2,
      ),
    )

    const result =
      validateStep(
        'advantages',
        draft,
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)


test(
  'Celda con Refugio nivel 2 supera la validación',
  () => {
    const draft =
      draftWithAdvantages([
        {
          selectionId:
            'haven-1',
          definitionKey:
            'haven',
          category:
            'background',
          rating:
            2,
          origin:
            'creation',
          details: {
            kind: 'haven',
          },
        },
        {
          selectionId:
            'haven-cell-1',
          definitionKey:
            'haven-cell',
          category:
            'merit',
          rating:
            1,
          origin:
            'creation',
          parentSelectionId:
            'haven-1',
        },
        {
          selectionId:
            'status-1',
          definitionKey:
            'status',
          category:
            'background',
          rating:
            4,
          origin:
            'creation',
          details: {
            kind: 'status',
          },
        },
        {
          selectionId:
            'illiterate-1',
          definitionKey:
            'illiterate',
          category:
            'flaw',
          rating:
            2,
          origin:
            'creation',
        },
      ])

    const result =
      validateStep(
        'advantages',
        draft,
      )

    assert.equal(
      result.valid,
      true,
    )
  },
)
