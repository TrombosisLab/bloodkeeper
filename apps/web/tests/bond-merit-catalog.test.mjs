import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getCharacterAdvantageDefinition,
} from '../src/features/character-creation/data/character-advantage-definitions.ts'

const MERITS = [
  {
    key: 'bond-resistance',
    name: 'Resistencia al Vínculo',
    ratings: [1, 2, 3],
  },
  {
    key: 'short-bond',
    name: 'Vínculo Breve',
    ratings: [2],
  },
  {
    key: 'unbondable',
    name: 'Invinculable',
    ratings: [5],
  },
]

const FLAWS = [
  'bondslave',
  'bond-junkie',
  'long-bond',
]

test(
  'los tres Méritos Core de Vínculo están registrados',
  () => {
    for (const expected of MERITS) {
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
        'merit',
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
        181,
      )
    }
  },
)

test(
  'Resistencia al Vínculo admite exactamente puntuaciones 1 a 3',
  () => {
    const definition =
      getCharacterAdvantageDefinition(
        'bond-resistance',
      )

    assert.ok(definition)

    assert.deepEqual(
      definition.allowedRatings,
      [1, 2, 3],
    )
  },
)

test(
  'los Méritos Core de Vínculo no inventan requisitos globales',
  () => {
    for (const expected of MERITS) {
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
  'el catálogo no introduce incompatibilidades artificiales entre Méritos y Defectos de Vínculo',
  () => {
    for (const expected of MERITS) {
      const merit =
        getCharacterAdvantageDefinition(
          expected.key,
        )

      assert.ok(merit)

      for (const flawKey of FLAWS) {
        assert.equal(
          merit.incompatibleDefinitionKeys
            ?.includes(flawKey) ?? false,
          false,
        )
      }
    }

    for (const flawKey of FLAWS) {
      const flaw =
        getCharacterAdvantageDefinition(
          flawKey,
        )

      assert.ok(flaw)

      for (const merit of MERITS) {
        assert.equal(
          flaw.incompatibleDefinitionKeys
            ?.includes(merit.key) ?? false,
          false,
        )
      }
    }
  },
)

test(
  'Yonqui del Vínculo y Vínculo Breve permanecen combinables en el catálogo',
  () => {
    const junkie =
      getCharacterAdvantageDefinition(
        'bond-junkie',
      )

    const shortBond =
      getCharacterAdvantageDefinition(
        'short-bond',
      )

    assert.ok(junkie)
    assert.ok(shortBond)

    assert.equal(
      junkie.incompatibleDefinitionKeys
        ?.includes('short-bond') ?? false,
      false,
    )

    assert.equal(
      shortBond.incompatibleDefinitionKeys
        ?.includes('bond-junkie') ?? false,
      false,
    )
  },
)
