import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InvalidCharacterRouseCheckRequestError,
  parseExecuteCharacterRouseCheckRequest,
  toCharacterRouseCheckResponse,
} from '../dist/characters/presentation/character-rouse-check.dto.js'

const characterId =
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const operationId =
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

test(
  '059-B DTO público acepta sólo intención mínima y no resultados autoritativos',
  () => {
    assert.deepEqual(
      parseExecuteCharacterRouseCheckRequest(
        characterId,
        {
          expectedRevision: 4,
          operationId,
          reason: 'bloodSurge',
        },
      ),
      {
        characterId,
        expectedRevision: 4,
        operationId,
        reason: 'bloodSurge',
      },
    )

    for (const forbidden of [
      'forced',
      'rolls',
      'selectedResult',
      'success',
      'hungerBefore',
      'hungerAfter',
      'bloodPotency',
      'disciplinePowerLevel',
    ]) {
      assert.throws(
        () =>
          parseExecuteCharacterRouseCheckRequest(
            characterId,
            {
              expectedRevision: 4,
              operationId,
              reason: 'other',
              [forbidden]: true,
            },
          ),
        InvalidCharacterRouseCheckRequestError,
      )
    }
  },
)

test(
  '059-B DTO difiere Rubor y Poderes a integraciones contextuales',
  () => {
    for (const reason of [
      'blushOfLife',
      'disciplinePower',
    ]) {
      assert.throws(
        () =>
          parseExecuteCharacterRouseCheckRequest(
            characterId,
            {
              expectedRevision: 4,
              operationId,
              reason,
            },
          ),
        InvalidCharacterRouseCheckRequestError,
      )
    }
  },
)

test(
  '059-B response estructura dificultad 4 sin inventar estado de Frenesí',
  () => {
    const response =
      toCharacterRouseCheckResponse({
        characterId,
        operationId,
        actorId:
          'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
        reason: 'other',
        forced: true,
        bloodPotency: null,
        disciplinePowerLevel: null,
        rolls: [2],
        selectedResult: 2,
        success: false,
        hungerBefore: 5,
        hungerAfter: 5,
        consequence:
          'hungerFrenzyTestRequired',
        consequenceDifficulty: 4,
        rollHistoryId:
          'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        characterRevision: 5,
        createdAt:
          new Date(
            '2026-08-21T20:00:00.000Z',
          ),
      })

    assert.deepEqual(
      response.consequence,
      {
        kind:
          'hungerFrenzyTestRequired',
        difficulty: 4,
      },
    )
  },
)
