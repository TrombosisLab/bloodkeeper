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
  parseManifestInitialDisciplineRequest,
  parseManifestInitialPowerRequest,
} from '../dist/characters/presentation/character-initial-vampire.dto.js'

const characterId =
  '33333333-3333-4333-8333-333333333333'

test(
  '057-E2 publica PATCH explícitos',
  () => {
    for (
      const [method, path] of [
        [
          'discipline',
          ':characterId/initial-vampire/discipline',
        ],
        [
          'power',
          ':characterId/initial-vampire/power',
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
  '057-E2 DTO exige todos los datos',
  () => {
    assert.deepEqual(
      parseManifestInitialDisciplineRequest(
        characterId,
        {
          expectedRevision: 4,
          disciplineKey: 'celerity',
          rating: 2,
        },
      ),
      {
        characterId,
        expectedRevision: 4,
        disciplineKey: 'celerity',
        rating: 2,
      },
    )

    assert.deepEqual(
      parseManifestInitialPowerRequest(
        characterId,
        {
          expectedRevision: 5,
          disciplineKey: 'celerity',
          powerKey:
            'celerity-cats-grace',
        },
      ),
      {
        characterId,
        expectedRevision: 5,
        disciplineKey: 'celerity',
        powerKey:
          'celerity-cats-grace',
      },
    )

    assert.throws(
      () =>
        parseManifestInitialPowerRequest(
          characterId,
          {
            expectedRevision: 5,
            disciplineKey: 'celerity',
          },
        ),
      InvalidInitialVampireResolutionRequestError,
    )
  },
)
