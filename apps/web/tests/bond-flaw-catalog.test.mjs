import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getCharacterAdvantageDefinition,
} from '../src/features/character-creation/data/character-advantage-definitions.ts'

const EXPECTED = [
  {
    key: 'bondslave',
    name: 'Esclavo Vinculado',
    ratings: [2],
    page: 180,
  },
  {
    key: 'bond-junkie',
    name: 'Yonqui del Vínculo',
    ratings: [1],
    page: 180,
  },
  {
    key: 'long-bond',
    name: 'Vínculo Largo',
    ratings: [1],
    page: 181,
  },
]

test(
  'los tres Defectos Core de Vínculo están registrados',
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
        'flaw',
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
        expected.page,
      )
    }
  },
)

test(
  'los Defectos Core de Vínculo no inventan requisitos globales',
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

      assert.equal(
        definition.requiresInstanceDetails,
        false,
      )
    }
  },
)

test(
  'los Defectos Core de Vínculo no declaran incompatibilidades inventadas',
  () => {
    for (const expected of EXPECTED) {
      const definition =
        getCharacterAdvantageDefinition(
          expected.key,
        )

      assert.ok(definition)

      assert.equal(
        definition.incompatibleDefinitionKeys,
        undefined,
      )
    }
  },
)
