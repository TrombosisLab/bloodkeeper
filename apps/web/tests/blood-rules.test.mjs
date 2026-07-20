import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createInitialBloodDraft,
  deriveCharacterTraits,
  getBloodPotencyRange,
  normalizeBloodForGeneration,
  updateBloodPotency,
  updateHunger,
  validateBloodDraft,
} from '../src/features/character-creation/domain/blood-rules.ts'

test(
  'crea sangre inicial coherente para generación 13',
  () => {
    const blood =
      createInitialBloodDraft(13)

    assert.deepEqual(
      blood,
      {
        bloodPotency: 1,
        hunger: 1,
      },
    )

    assert.equal(
      validateBloodDraft(
        blood,
        13,
      ).valid,
      true,
    )
  },
)

test(
  'define rangos de potencia por generación',
  () => {
    assert.deepEqual(
      getBloodPotencyRange(10),
      { min: 1, max: 4 },
    )

    assert.deepEqual(
      getBloodPotencyRange(13),
      { min: 1, max: 3 },
    )

    assert.deepEqual(
      getBloodPotencyRange(16),
      { min: 0, max: 0 },
    )
  },
)

test(
  'cambiar generación normaliza potencia fuera del rango',
  () => {
    const blood = {
      bloodPotency: 4,
      hunger: 1,
    }

    const changed =
      normalizeBloodForGeneration(
        blood,
        16,
      )

    assert.equal(
      changed.bloodPotency,
      0,
    )
  },
)

test(
  'potencia respeta límites de la generación única',
  () => {
    const blood =
      createInitialBloodDraft(13)

    assert.equal(
      updateBloodPotency(
        blood,
        13,
        99,
      ).bloodPotency,
      3,
    )

    assert.equal(
      updateBloodPotency(
        blood,
        13,
        -4,
      ).bloodPotency,
      1,
    )
  },
)

test(
  'hambre queda limitada entre 0 y 5',
  () => {
    const blood =
      createInitialBloodDraft()

    assert.equal(
      updateHunger(
        blood,
        -2,
      ).hunger,
      0,
    )

    assert.equal(
      updateHunger(
        blood,
        20,
      ).hunger,
      5,
    )
  },
)

test(
  'salud deriva de resistencia más tres',
  () => {
    const attributes = {
      strength: 2,
      dexterity: 2,
      stamina: 4,

      charisma: 2,
      manipulation: 2,
      composure: 3,

      intelligence: 2,
      wits: 2,
      resolve: 3,
    }

    assert.equal(
      deriveCharacterTraits(
        attributes,
      ).health,
      7,
    )
  },
)

test(
  'fuerza de voluntad deriva de compostura más resolución',
  () => {
    const attributes = {
      strength: 2,
      dexterity: 2,
      stamina: 4,

      charisma: 2,
      manipulation: 2,
      composure: 3,

      intelligence: 2,
      wits: 2,
      resolve: 3,
    }

    assert.equal(
      deriveCharacterTraits(
        attributes,
      ).willpower,
      6,
    )
  },
)

test(
  'sangre no valida sin generación seleccionada',
  () => {
    const result =
      validateBloodDraft(
        {
          bloodPotency: 1,
          hunger: 1,
        },
        null,
      )

    assert.equal(
      result.valid,
      false,
    )
  },
)
