import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getCharacterAdvantageDefinition,
} from '../src/features/character-creation/data/character-advantage-definitions.ts'

const EXPECTED = [
  {
    key: 'cross-repulsion',
    name: 'Repulsión de Cruces',
    category: 'flaw',
    ratings: [2],
  },
  {
    key: 'no-reflection',
    name: 'Sin Reflejo',
    category: 'flaw',
    ratings: [1],
  },
  {
    key: 'eat-food',
    name: 'Comer Comida',
    category: 'merit',
    ratings: [2],
  },
]

test(
  'Míticos II registra sus tres definiciones Core',
  () => {
    for (const expected of EXPECTED) {
      const definition =
        getCharacterAdvantageDefinition(
          expected.key,
        )

      assert.ok(definition)

      assert.equal(
        definition.name,
        expected.name,
      )

      assert.equal(
        definition.category,
        expected.category,
      )

      assert.deepEqual(
        definition.allowedRatings,
        expected.ratings,
      )

      assert.equal(
        definition.source,
        'core',
      )

      assert.equal(
        definition.sourcePage,
        182,
      )
    }
  },
)

test(
  'Míticos II usa puntuaciones normativas exactas',
  () => {
    assert.deepEqual(
      getCharacterAdvantageDefinition(
        'cross-repulsion',
      )?.allowedRatings,
      [2],
    )

    assert.deepEqual(
      getCharacterAdvantageDefinition(
        'no-reflection',
      )?.allowedRatings,
      [1],
    )

    assert.deepEqual(
      getCharacterAdvantageDefinition(
        'eat-food',
      )?.allowedRatings,
      [2],
    )
  },
)

test(
  'Míticos II no inventa datos de instancia ni requisitos de elegibilidad',
  () => {
    for (const expected of EXPECTED) {
      const definition =
        getCharacterAdvantageDefinition(
          expected.key,
        )

      assert.ok(definition)

      assert.equal(
        definition.allowMultiple,
        false,
      )

      assert.equal(
        definition.requiresInstanceDetails,
        false,
      )

      assert.equal(
        definition.instanceDetailsKind,
        undefined,
      )

      assert.equal(
        definition.requirements,
        undefined,
      )
    }
  },
)

test(
  'Repulsión de Cruces es independiente de Repulsivo de Aspecto',
  () => {
    const crossRepulsion =
      getCharacterAdvantageDefinition(
        'cross-repulsion',
      )

    const repulsive =
      getCharacterAdvantageDefinition(
        'repulsive',
      )

    assert.ok(crossRepulsion)
    assert.ok(repulsive)

    assert.notEqual(
      crossRepulsion.key,
      repulsive.key,
    )

    assert.equal(
      crossRepulsion.name,
      'Repulsión de Cruces',
    )

    assert.equal(
      repulsive.name,
      'Repulsivo',
    )
  },
)
