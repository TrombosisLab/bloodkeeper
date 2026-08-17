import assert from 'node:assert/strict'
import test from 'node:test'
import 'reflect-metadata'

import {
  RequestMethod,
} from '@nestjs/common'

import {
  CharacterInitialVampireController,
} from '../dist/characters/presentation/character-initial-vampire.controller.js'

import {
  InvalidInitialVampireResolutionRequestError,
  parseEstablishInitialBloodRequest,
  parseResolveInitialClanRequest,
  parseResolveInitialGenerationRequest,
  parseResolveInitialSireRequest,
} from '../dist/characters/presentation/character-initial-vampire.dto.js'

const characterId =
  '33333333-3333-4333-8333-333333333333'

test(
  '057-E1 publica PATCH específicos de identidad y Sangre',
  () => {
    assert.equal(
      Reflect.getMetadata(
        'path',
        CharacterInitialVampireController,
      ),
      'characters',
    )

    for (
      const [method, path] of [
        [
          'clan',
          ':characterId/initial-vampire/clan',
        ],
        [
          'generation',
          ':characterId/initial-vampire/generation',
        ],
        [
          'sire',
          ':characterId/initial-vampire/sire',
        ],
        [
          'blood',
          ':characterId/initial-vampire/blood',
        ],
      ]
    ) {
      const handler =
        CharacterInitialVampireController
          .prototype[method]

      assert.equal(
        Reflect.getMetadata('path', handler),
        path,
      )
      assert.equal(
        Reflect.getMetadata('method', handler),
        RequestMethod.PATCH,
      )
    }
  },
)

test(
  '057-E1 DTO exige valores explícitos',
  () => {
    assert.deepEqual(
      parseResolveInitialClanRequest(
        characterId,
        {
          expectedRevision: 2,
          clanKey: 'brujah',
        },
      ),
      {
        characterId,
        expectedRevision: 2,
        clanKey: 'brujah',
      },
    )

    assert.deepEqual(
      parseResolveInitialSireRequest(
        characterId,
        {
          expectedRevision: 3,
          sire: 'Helena',
        },
      ),
      {
        characterId,
        expectedRevision: 3,
        sire: 'Helena',
      },
    )

    assert.throws(
      () =>
        parseResolveInitialSireRequest(
          characterId,
          {
            expectedRevision: 3,
            sire: '   ',
          },
        ),
      InvalidInitialVampireResolutionRequestError,
    )

    assert.deepEqual(
      parseResolveInitialGenerationRequest(
        characterId,
        {
          expectedRevision: 3,
          generation: 13,
        },
      ),
      {
        characterId,
        expectedRevision: 3,
        generation: 13,
      },
    )

    assert.deepEqual(
      parseEstablishInitialBloodRequest(
        characterId,
        {
          expectedRevision: 4,
          bloodPotency: 1,
          hunger: 2,
        },
      ),
      {
        characterId,
        expectedRevision: 4,
        bloodPotency: 1,
        hunger: 2,
      },
    )

    assert.throws(
      () =>
        parseEstablishInitialBloodRequest(
          characterId,
          {
            expectedRevision: 4,
            bloodPotency: 1,
          },
        ),
      InvalidInitialVampireResolutionRequestError,
    )
  },
)
