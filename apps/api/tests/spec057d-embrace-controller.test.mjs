import assert from 'node:assert/strict'
import test from 'node:test'
import 'reflect-metadata'

import {
  RequestMethod,
} from '@nestjs/common'

import {
  CharacterEmbraceWriteConflictError,
} from '../dist/characters/application/character-draft.repository.js'

import {
  CharacterAlreadyEmbracedError,
  CharacterEmbracePermissionError,
} from '../dist/characters/application/embrace-character.use-case.js'

import {
  CharacterEmbraceController,
} from '../dist/characters/presentation/character-embrace.controller.js'

import {
  InvalidCharacterEmbraceRequestError,
  parseCharacterEmbraceRequest,
} from '../dist/characters/presentation/character-embrace.dto.js'

const actorId =
  'c968ef0b-0bc6-4d00-87af-8aa17e7dc850'
const characterId =
  '5052a5af-2054-4df2-8960-a0f01d57fb7e'

test(
  '057-D publica POST /characters/:characterId/embrace',
  () => {
    assert.equal(
      Reflect.getMetadata(
        'path',
        CharacterEmbraceController,
      ),
      'characters',
    )

    const handler =
      CharacterEmbraceController.prototype.execute

    assert.equal(
      Reflect.getMetadata(
        'path',
        handler,
      ),
      ':characterId/embrace',
    )
    assert.equal(
      Reflect.getMetadata(
        'method',
        handler,
      ),
      RequestMethod.POST,
    )
  },
)

test(
  '057-D DTO acepta sólo expectedRevision',
  () => {
    assert.deepEqual(
      parseCharacterEmbraceRequest(
        characterId,
        {
          expectedRevision: 4,
        },
      ),
      {
        characterId,
        expectedRevision: 4,
      },
    )

    assert.throws(
      () =>
        parseCharacterEmbraceRequest(
          characterId,
          {
            expectedRevision: 4,
            nature: 'vampire',
          },
        ),
      InvalidCharacterEmbraceRequestError,
    )
  },
)

async function statusFor(error) {
  const controller =
    new CharacterEmbraceController({
      async execute() {
        throw error
      },
    })

  try {
    await controller.execute(
      {
        user: {
          id: actorId,
        },
      },
      characterId,
      {
        expectedRevision: 4,
      },
    )
  } catch (caught) {
    return {
      status: caught.getStatus(),
      body: caught.getResponse(),
    }
  }

  throw new Error(
    'Expected controller error',
  )
}

test(
  '057-D traduce permiso conflicto y segundo Abrazo a errores estructurados',
  async () => {
    assert.equal(
      (
        await statusFor(
          new CharacterEmbracePermissionError(),
        )
      ).status,
      403,
    )

    assert.equal(
      (
        await statusFor(
          new CharacterEmbraceWriteConflictError(
            characterId,
          ),
        )
      ).status,
      409,
    )

    const second =
      await statusFor(
        new CharacterAlreadyEmbracedError(
          characterId,
        ),
      )

    assert.equal(second.status, 409)
    assert.deepEqual(
      second.body,
      {
        code:
          'CHARACTER_ALREADY_EMBRACED',
      },
    )
  },
)
