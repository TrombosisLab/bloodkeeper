import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getCharacterAdvantageDefinition,
} from '../src/features/character-creation/data/character-advantage-definitions.ts'

import {
  validateCharacterAdvantageEligibility,
} from '../src/features/character-creation/domain/advantage-eligibility-rules.ts'

test(
  'Arcaico Core registra sus dos Defectos normativos',
  () => {
    const archaic =
      getCharacterAdvantageDefinition(
        'archaic',
      )

    const livingInThePast =
      getCharacterAdvantageDefinition(
        'living-in-the-past',
      )

    assert.ok(archaic)
    assert.ok(livingInThePast)

    assert.deepEqual(
      {
        name: archaic.name,
        category: archaic.category,
        ratings: archaic.allowedRatings,
      },
      {
        name: 'Arcaico',
        category: 'flaw',
        ratings: [2],
      },
    )

    assert.deepEqual(
      {
        name: livingInThePast.name,
        category: livingInThePast.category,
        ratings:
          livingInThePast.allowedRatings,
      },
      {
        name: 'Vivir en el Pasado',
        category: 'flaw',
        ratings: [1],
      },
    )
  },
)

test(
  'los dos Defectos Arcaicos requieren como mínimo categoría Ancilla',
  () => {
    for (
      const key of [
        'archaic',
        'living-in-the-past',
      ]
    ) {
      const definition =
        getCharacterAdvantageDefinition(key)

      assert.ok(definition)

      assert.deepEqual(
        definition.requirements,
        {
          minimumAgeCategory:
            'ancilla',
        },
      )
    }
  },
)

test(
  'un neonato no puede adquirir Defectos Arcaicos',
  () => {
    for (
      const key of [
        'archaic',
        'living-in-the-past',
      ]
    ) {
      const definition =
        getCharacterAdvantageDefinition(key)

      assert.ok(definition)

      const result =
        validateCharacterAdvantageEligibility(
          definition,
          {
            characterKind: 'standard',
            clanKey: null,
            ageCategory: 'neonate',
          },
        )

      assert.equal(
        result.eligible,
        false,
      )
    }
  },
)

test(
  'Ancillae y Antiguos pueden adquirir Defectos Arcaicos',
  () => {
    for (
      const key of [
        'archaic',
        'living-in-the-past',
      ]
    ) {
      const definition =
        getCharacterAdvantageDefinition(key)

      assert.ok(definition)

      for (
        const ageCategory of [
          'ancilla',
          'elder',
        ]
      ) {
        const result =
          validateCharacterAdvantageEligibility(
            definition,
            {
              characterKind:
                'standard',
              clanKey: null,
              ageCategory,
            },
          )

        assert.equal(
          result.eligible,
          true,
        )
      }
    }
  },
)

test(
  'una categoría etaria desconocida bloquea correctamente los Defectos Arcaicos',
  () => {
    const definition =
      getCharacterAdvantageDefinition(
        'archaic',
      )

    assert.ok(definition)

    const result =
      validateCharacterAdvantageEligibility(
        definition,
        {
          characterKind: 'standard',
          clanKey: null,
          ageCategory: null,
        },
      )

    assert.equal(
      result.eligible,
      false,
    )

    assert.ok(
      result.errors.some(
        (error) =>
          error.includes(
            'categoría etaria conocida',
          ),
      ),
    )
  },
)
