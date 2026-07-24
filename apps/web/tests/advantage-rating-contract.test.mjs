import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterAdvantageDefinitions,
} from '../src/features/character-creation/data/character-advantage-definitions.ts'

import {
  validateCharacterAdvantagesStructure,
} from '../src/features/character-creation/domain/advantage-rules.ts'

import {
  validateCharacterAdvantageSelectionsAgainstDefinitions,
} from '../src/features/character-creation/domain/advantage-definition-rules.ts'

function validateSelection(selection) {
  const draft = {
    selections: [selection],
  }

  return {
    structural:
      validateCharacterAdvantagesStructure(
        draft,
      ),

    againstDefinitions:
      validateCharacterAdvantageSelectionsAgainstDefinitions(
        draft,
        characterAdvantageDefinitions,
      ),
  }
}

test(
  'el contrato integrado admite Aliados con rating 6',
  () => {
    const result =
      validateSelection({
        selectionId:
          'allies-rating-six',
        definitionKey:
          'allies',
        category:
          'background',
        rating:
          6,
        origin:
          'creation',
        details: {
          kind:
            'allies',
          effectiveness:
            3,
          reliability:
            3,
          identity:
            'Grupo aliado',
        },
      })

    assert.equal(
      result.structural.valid,
      true,
    )

    assert.equal(
      result.againstDefinitions.valid,
      true,
    )

    assert.deepEqual(
      result.structural.errors,
      [],
    )

    assert.deepEqual(
      result.againstDefinitions.errors,
      [],
    )
  },
)

test(
  'rating 6 estructuralmente representable sigue siendo rechazado cuando la definición no lo permite',
  () => {
    const result =
      validateSelection({
        selectionId:
          'status-rating-six',
        definitionKey:
          'status',
        category:
          'background',
        rating:
          6,
        origin:
          'creation',
        details: {
          kind:
            'status',
          sphere:
            'Camarilla',
        },
      })

    assert.equal(
      result.structural.valid,
      true,
    )

    assert.equal(
      result.againstDefinitions.valid,
      false,
    )

    assert.equal(
      result.againstDefinitions.errors.some(
        (error) =>
          error.includes(
            'no está permitida para Estatus',
          ),
      ),
      true,
    )
  },
)

test(
  'rating 7 es inválido ya en la capa estructural',
  () => {
    const result =
      validateSelection({
        selectionId:
          'allies-rating-seven',
        definitionKey:
          'allies',
        category:
          'background',
        rating:
          7,
        origin:
          'creation',
        details: {
          kind:
            'allies',
          effectiveness:
            4,
          reliability:
            3,
        },
      })

    assert.equal(
      result.structural.valid,
      false,
    )

    assert.equal(
      result.structural.errors.some(
        (error) =>
          error.includes(
            'entero entre 1 y 6',
          ),
      ),
      true,
    )

    assert.equal(
      result.againstDefinitions.valid,
      false,
    )
  },
)
