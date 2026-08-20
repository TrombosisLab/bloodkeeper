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

test('058-B DTO normaliza perfil y exige revision/operacion', () => {
  assert.deepEqual(
    parseApplyCharacterBloodResonanceRequest(
      characterId,
      {
        expectedRevision: 4,
        operationId,
        sourceKind: 'human',
        resonanceKey: 'choleric',
        temperament: 'intense',
        hungerSlaked: 1,
      },
    ),
    {
      characterId,
      expectedRevision: 4,
      operationId,
      sourceKind: 'human',
      resonanceKey: 'choleric',
      specialAffinityKey: null,
      temperament: 'intense',
      hungerSlaked: 1,
    },
  )
})

test('058-B DTO no acepta bonus ni campos de Dados', () => {
  assert.throws(
    () =>
      parseApplyCharacterBloodResonanceRequest(
        characterId,
        {
          expectedRevision: 4,
          operationId,
          sourceKind: 'human',
          hungerSlaked: 1,
          diceBonus: 1,
        },
      ),
    InvalidCharacterBloodResonanceRequestError,
  )
})
