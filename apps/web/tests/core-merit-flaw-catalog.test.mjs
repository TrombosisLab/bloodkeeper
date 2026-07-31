import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterAdvantageDefinitions,
  getCharacterAdvantageDefinition,
} from '../src/features/character-creation/data/character-advantage-definitions.ts'

const EXPECTED = [
  {
    key: 'linguistics',
    name: 'Lingüística',
    category: 'merit',
    ratings: [1, 2, 3, 4, 5],
  },
  {
    key: 'illiterate',
    name: 'Analfabeto',
    category: 'flaw',
    ratings: [2],
  },
  {
    key: 'ugly',
    name: 'Feo',
    category: 'flaw',
    ratings: [1],
  },
  {
    key: 'repulsive',
    name: 'Repulsivo',
    category: 'flaw',
    ratings: [2],
  },
  {
    key: 'beautiful',
    name: 'Bello',
    category: 'merit',
    ratings: [2],
  },
  {
    key: 'stunning',
    name: 'Despampanante',
    category: 'merit',
    ratings: [4],
  },
    {
      key: 'infamy',
      name: 'Infamia',
      category: 'flaw',
      ratings: [1, 2, 3, 4, 5],
    },
    {
      key: 'despised',
      name: 'Despreciado',
      category: 'flaw',
      ratings: [1],
    },
    {
      key: 'hatred',
      name: 'Odio',
      category: 'flaw',
      ratings: [2],
    },
    {
      key: 'exiled',
      name: 'Expulsado',
      category: 'flaw',
      ratings: [1, 2, 3],
    },
    {
      key: 'suspect',
      name: 'Sospechoso',
      category: 'flaw',
      ratings: [1],
    },
    {
      key: 'shunned',
      name: 'Rechazado',
      category: 'flaw',
      ratings: [2],
    },
    {
      key: 'mortal-pretender',
      name: 'Pretendiente Mortal',
      category: 'flaw',
      ratings: [1],
    },
]

test(
  'Lingüística y Aspecto Core están registrados en la página 179',
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
        179,
      )
    }
  },
)

test(
  'Lingüística y Aspecto no incorporan requisitos globales inventados',
  () => {
    for (const expected of EXPECTED) {
      const definition =
        getCharacterAdvantageDefinition(
          expected.key,
        )

      assert.ok(definition)

      assert.equal(
        definition.requirements,
        undefined,
      )
    }
  },
)

test(
  'las nuevas definiciones Core conservan claves únicas',
  () => {
    const keys =
      characterAdvantageDefinitions.map(
        (definition) => definition.key,
      )

    assert.equal(
      new Set(keys).size,
      keys.length,
    )
  },
)
