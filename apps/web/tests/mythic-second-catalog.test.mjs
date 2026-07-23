import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getCharacterAdvantageDefinition,
} from '../src/features/character-creation/data/character-advantage-definitions.ts'

test(
  'la continuación normativa de Míticos registra Estigmas y Comer Comida',
  () => {
    const stigmata =
      getCharacterAdvantageDefinition(
        'stigmata',
      )

    assert.ok(stigmata)

    assert.equal(
      stigmata.name,
      'Estigmas',
    )

    assert.equal(
      stigmata.category,
      'flaw',
    )

    assert.deepEqual(
      stigmata.allowedRatings,
      [1],
    )

    assert.equal(
      stigmata.source,
      'core',
    )

    assert.equal(
      stigmata.sourcePage,
      182,
    )

    const eatFood =
      getCharacterAdvantageDefinition(
        'eat-food',
      )

    assert.ok(eatFood)

    assert.equal(
      eatFood.name,
      'Comer Comida',
    )

    assert.equal(
      eatFood.category,
      'merit',
    )

    assert.deepEqual(
      eatFood.allowedRatings,
      [2],
    )
  },
)

test(
  'Estigmas y Comer Comida no requieren configuración de instancia',
  () => {
    for (
      const key of [
        'stigmata',
        'eat-food',
      ]
    ) {
      const definition =
        getCharacterAdvantageDefinition(key)

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
    }
  },
)
