import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getCharacterAdvantageDefinition,
} from '../src/features/character-creation/data/character-advantage-definitions.ts'

import {
  validateCharacterAdvantageEligibility,
} from '../src/features/character-creation/domain/advantage-eligibility-rules.ts'

const EXPECTED = [
  {
    key: 'vegan',
    name: 'Vegano',
    ratings: [2],
  },
  {
    key: 'organovore',
    name: 'Organóvoro',
    ratings: [2],
  },
  {
    key: 'methuselah-thirst',
    name: 'Sed de Matusalén',
    ratings: [1],
  },
]

test(
  'los Defectos Core fijos de Alimentación están registrados',
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
        181,
      )
    }
  },
)

test(
  'Vegano excluye explícitamente al clan Ventrue',
  () => {
    const definition =
      getCharacterAdvantageDefinition(
        'vegan',
      )

    assert.ok(definition)

    assert.deepEqual(
      definition.requirements,
      {
        excludedClanKeys: [
          'ventrue',
        ],
      },
    )

    const ventrue =
      validateCharacterAdvantageEligibility(
        definition,
        {
          characterKind: 'standard',
          clanKey: 'ventrue',
          ageCategory: null,
        },
      )

    assert.equal(
      ventrue.eligible,
      false,
    )

    const brujah =
      validateCharacterAdvantageEligibility(
        definition,
        {
          characterKind: 'standard',
          clanKey: 'brujah',
          ageCategory: null,
        },
      )

    assert.equal(
      brujah.eligible,
      true,
    )
  },
)

test(
  'Organóvoro y Sed de Matusalén no inventan requisitos globales',
  () => {
    for (
      const key of [
        'organovore',
        'methuselah-thirst',
      ]
    ) {
      const definition =
        getCharacterAdvantageDefinition(key)

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
