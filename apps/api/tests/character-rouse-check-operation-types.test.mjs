import assert from 'node:assert/strict'
import test from 'node:test'

import {
  isSameCharacterRouseCheckOperation,
} from '../dist/characters/domain/character-rouse-check-operation.types.js'

const existing = {
  characterId: 'character-1',
  operationId: 'operation-1',
  actorId: 'owner-1',
  reason: 'bloodSurge',
  forced: false,
  bloodPotency: null,
  disciplinePowerLevel: null,
  rolls: [4],
  selectedResult: 4,
  success: false,
  hungerBefore: 2,
  hungerAfter: 3,
  consequence: 'none',
  consequenceDifficulty: null,
  rollHistoryId: 'history-1',
  characterRevision: 9,
  createdAt: new Date(),
}

test(
  '059-B idempotencia compara la intención estable y no el resultado aleatorio',
  () => {
    assert.equal(
      isSameCharacterRouseCheckOperation(
        existing,
        {
          actorId: 'owner-1',
          reason: 'bloodSurge',
        },
      ),
      true,
    )

    assert.equal(
      isSameCharacterRouseCheckOperation(
        existing,
        {
          actorId: 'owner-1',
          reason: 'healing',
        },
      ),
      false,
    )

    assert.equal(
      isSameCharacterRouseCheckOperation(
        existing,
        {
          actorId: 'other-actor',
          reason: 'bloodSurge',
        },
      ),
      false,
    )
  },
)
