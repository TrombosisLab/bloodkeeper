import assert from 'node:assert/strict'
import test from 'node:test'

import {
  randomizeAttributes,
  updateAttribute,
  validateAttributeDistribution,
} from '../src/features/character-creation/domain/attribute-rules.ts'

const validAttributes = {
  strength: 4,

  dexterity: 3,
  stamina: 3,
  charisma: 3,

  manipulation: 2,
  composure: 2,
  intelligence: 2,
  wits: 2,

  resolve: 1,
}

test(
  'acepta una distribución V5 válida',
  () => {
    const result =
      validateAttributeDistribution(
        validAttributes,
      )

    assert.equal(
      result.valid,
      true,
    )

    assert.deepEqual(
      result.errors,
      [],
    )
  },
)

test(
  'rechaza una distribución inválida',
  () => {
    const result =
      validateAttributeDistribution({
        strength: 4,
        dexterity: 4,
        stamina: 1,

        charisma: 1,
        manipulation: 1,
        composure: 1,

        intelligence: 1,
        wits: 1,
        resolve: 1,
      })

    assert.equal(
      result.valid,
      false,
    )

    assert.ok(
      result.errors.length > 0,
    )
  },
)

test(
  'el reparto aleatorio siempre genera una distribución válida',
  () => {
    for (
      let iteration = 0;
      iteration < 500;
      iteration += 1
    ) {
      const attributes =
        randomizeAttributes()

      const result =
        validateAttributeDistribution(
          attributes,
        )

      assert.equal(
        result.valid,
        true,
      )
    }
  },
)

test(
  'la actualización respeta los límites 1 y 4',
  () => {
    const below =
      updateAttribute(
        validAttributes,
        'strength',
        0,
      )

    const above =
      updateAttribute(
        validAttributes,
        'strength',
        8,
      )

    assert.equal(
      below.strength,
      1,
    )

    assert.equal(
      above.strength,
      4,
    )
  },
)
