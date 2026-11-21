import assert from 'node:assert/strict'
import test from 'node:test'

import {
  validateStep,
} from '../src/features/character-creation/domain/step-validation.ts'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  validateAdvantageParentRelations,
} from '../src/features/character-creation/domain/advantage-parent-rules.ts'

import {
  characterAdvantageDefinitions,
} from '../src/features/character-creation/data/character-advantage-definitions.ts'


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
  'Enemigo vinculado a Aliados cuesta dos puntos menos que su Efectividad',
  () => {
    const allies = {
      selectionId: 'allies-parent',
      definitionKey: 'allies',
      category: 'background',
      rating: 5,
      origin: 'creation',
      details: {
        kind: 'allies',
        effectiveness: 4,
        reliability: 1,
      },
    }
    const enemy = (rating) => ({
      selectionId: `enemy-${rating}`,
      definitionKey: 'enemy',
      category: 'flaw',
      rating,
      origin: 'creation',
      parentSelectionId: 'allies-parent',
      details: {
        kind: 'enemy',
        identity: 'Rival conocido',
      },
    })

    const valid = validateAdvantageParentRelations(
      { selections: [allies, enemy(2)] },
      characterAdvantageDefinitions,
    )
    const invalid = validateAdvantageParentRelations(
      { selections: [allies, enemy(1)] },
      characterAdvantageDefinitions,
    )

    assert.equal(valid.valid, true)
    assert.equal(invalid.valid, false)
    assert.ok(invalid.errors.some((error) =>
      error.includes('dos puntos inferior'),
    ))
  },
)


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
