import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InvalidCharacterBlushOfLifeRequestError,
  parseUseCharacterBlushOfLifeRequest,
  toCharacterBlushOfLifeResponse,
} from '../dist/characters/presentation/character-blush-of-life.dto.js'

const characterId =
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const operationId =
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

test(
  '059-D1A DTO acepta sólo expectedRevision y operationId',
  () => {
    assert.deepEqual(
      parseUseCharacterBlushOfLifeRequest(
        characterId,
        {
          expectedRevision: 8,
          operationId,
        },
      ),
      {
        characterId,
        expectedRevision: 8,
        operationId,
      },
    )

    for (const key of [
      'reason',
      'dyscrasiaKey',
      'sourceBloodOperationId',
      'hunger',
      'rolls',
      'success',
      'forced',
    ]) {
      assert.throws(
        () =>
          parseUseCharacterBlushOfLifeRequest(
            characterId,
            {
              expectedRevision: 8,
              operationId,
              [key]: true,
            },
          ),
        InvalidCharacterBlushOfLifeRequestError,
      )
    }
  },
)

test(
  '059-D1A response exenta no inventa tirada',
  () => {
    const response =
      toCharacterBlushOfLifeResponse({
        outcome:
          'rouseExempted',
        operation: {
          characterId,
          operationId,
          actorId:
            'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
          dyscrasiaKey:
            'enthusiasticAboutLife',
          sourceBloodOperationId:
            'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
          hungerBefore: 5,
          hungerAfter: 5,
          characterRevision: 9,
          createdAt:
            new Date(
              '2026-08-21T20:00:00.000Z',
            ),
        },
      })

    assert.equal(
      response.outcome,
      'rouseExempted',
    )
    assert.equal(
      'rolls' in response,
      false,
    )
    assert.equal(
      'rouse' in response,
      false,
    )
  },
)
