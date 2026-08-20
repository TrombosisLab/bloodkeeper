import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assertValidConsumedBloodDyscrasia,
  InvalidCharacterBloodResonanceError,
} from '../dist/characters/domain/character-blood-resonance.types.js'

test('058-D2 acepta Discrasia compatible sólo con Resonancia humoral Aguda', () => {
  assert.doesNotThrow(() =>
    assertValidConsumedBloodDyscrasia({
      resonanceKey: 'choleric',
      specialAffinityKey: null,
      temperament: 'acute',
      dyscrasiaKey: 'aggressive',
      dyscrasiaAcquisitionMode:
        'drainAndKill',
    }),
  )

  assert.doesNotThrow(() =>
    assertValidConsumedBloodDyscrasia({
      resonanceKey: 'sanguine',
      specialAffinityKey: null,
      temperament: 'acute',
      dyscrasiaKey: 'sniffingGame',
      dyscrasiaAcquisitionMode:
        'feedThreeNights',
    }),
  )
})

test('058-D2 mantiene compatible una alimentación sin Discrasia', () => {
  assert.doesNotThrow(() =>
    assertValidConsumedBloodDyscrasia({
      resonanceKey: 'choleric',
      specialAffinityKey: null,
      temperament: 'intense',
    }),
  )

  assert.doesNotThrow(() =>
    assertValidConsumedBloodDyscrasia({
      resonanceKey: null,
      specialAffinityKey: 'animalBlood',
      temperament: 'acute',
      dyscrasiaKey: null,
      dyscrasiaAcquisitionMode: null,
    }),
  )
})

test('058-D2 exige pareja key/modo completa', () => {
  assert.throws(
    () =>
      assertValidConsumedBloodDyscrasia({
        resonanceKey: 'choleric',
        specialAffinityKey: null,
        temperament: 'acute',
        dyscrasiaKey: 'aggressive',
        dyscrasiaAcquisitionMode: null,
      }),
    (error) => {
      assert.ok(
        error instanceof
          InvalidCharacterBloodResonanceError,
      )
      assert.deepEqual(
        error.violations,
        ['DYSCRASIA_ACQUISITION_INVALID'],
      )
      return true
    },
  )
})

test('058-D2 rechaza Discrasia sin Temperamento Agudo o en afinidad especial', () => {
  for (const profile of [
    {
      resonanceKey: 'choleric',
      specialAffinityKey: null,
      temperament: 'intense',
      dyscrasiaKey: 'aggressive',
      dyscrasiaAcquisitionMode:
        'drainAndKill',
    },
    {
      resonanceKey: null,
      specialAffinityKey: 'animalBlood',
      temperament: 'acute',
      dyscrasiaKey: 'aggressive',
      dyscrasiaAcquisitionMode:
        'drainAndKill',
    },
  ]) {
    assert.throws(
      () =>
        assertValidConsumedBloodDyscrasia(
          profile,
        ),
      (error) => {
        assert.ok(
          error instanceof
            InvalidCharacterBloodResonanceError,
        )
        assert.deepEqual(
          error.violations,
          ['DYSCRASIA_REQUIRES_ACUTE'],
        )
        return true
      },
    )
  }
})

test('058-D2 rechaza Resonancia que no corresponde a la Discrasia', () => {
  assert.throws(
    () =>
      assertValidConsumedBloodDyscrasia({
        resonanceKey: 'sanguine',
        specialAffinityKey: null,
        temperament: 'acute',
        dyscrasiaKey: 'aggressive',
        dyscrasiaAcquisitionMode:
          'drainAndKill',
      }),
    (error) => {
      assert.ok(
        error instanceof
          InvalidCharacterBloodResonanceError,
      )
      assert.deepEqual(
        error.violations,
        ['DYSCRASIA_RESONANCE_MISMATCH'],
      )
      return true
    },
  )
})
