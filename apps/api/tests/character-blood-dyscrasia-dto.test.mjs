import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InvalidCharacterBloodResonanceRequestError,
  parseApplyCharacterBloodResonanceRequest,
} from '../dist/characters/presentation/character-blood-resonance.dto.js'

const characterId =
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const operationId =
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

function base() {
  return {
    expectedRevision: 4,
    operationId,
    sourceKind: 'human',
    resonanceKey: 'choleric',
    specialAffinityKey: null,
    temperament: 'acute',
    hungerSlaked: 1,
  }
}

test('058-D2 DTO conserva forma legacy si no llega Discrasia', () => {
  assert.deepEqual(
    parseApplyCharacterBloodResonanceRequest(
      characterId,
      base(),
    ),
    {
      characterId,
      ...base(),
    },
  )
})

test('058-D2 DTO acepta key y modo canónicos', () => {
  const result =
    parseApplyCharacterBloodResonanceRequest(
      characterId,
      {
        ...base(),
        dyscrasiaKey: 'aggressive',
        dyscrasiaAcquisitionMode:
          'drainAndKill',
      },
    )

  assert.equal(
    result.dyscrasiaKey,
    'aggressive',
  )
  assert.equal(
    result.dyscrasiaAcquisitionMode,
    'drainAndKill',
  )
})

test('058-D2 DTO rechaza key o modo inventados', () => {
  assert.throws(
    () =>
      parseApplyCharacterBloodResonanceRequest(
        characterId,
        {
          ...base(),
          dyscrasiaKey: 'invented',
          dyscrasiaAcquisitionMode:
            'drainAndKill',
        },
      ),
    InvalidCharacterBloodResonanceRequestError,
  )

  assert.throws(
    () =>
      parseApplyCharacterBloodResonanceRequest(
        characterId,
        {
          ...base(),
          dyscrasiaKey: 'aggressive',
          dyscrasiaAcquisitionMode:
            'invented',
        },
      ),
    InvalidCharacterBloodResonanceRequestError,
  )
})
