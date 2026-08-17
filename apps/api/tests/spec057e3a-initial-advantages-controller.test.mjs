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
  parseReviewInitialAdvantagesRequest,
} from '../dist/characters/presentation/character-initial-vampire.dto.js'

const characterId =
  '33333333-3333-4333-8333-333333333333'

function advantages() {
  return {
    selections: [
      {
        selectionId: 'haven',
        definitionKey: 'haven',
        category: 'background',
        rating: 3,
        origin: 'creation',
        parentSelectionId: null,
        details: {
          kind: 'haven',
          identity: 'Piso',
        },
      },
      {
        selectionId: 'resources',
        definitionKey: 'resources',
        category: 'background',
        rating: 4,
        origin: 'creation',
        parentSelectionId: null,
        details: {
          kind: 'resources',
          source: 'Trabajo',
        },
      },
      {
        selectionId: 'enemy',
        definitionKey: 'enemy',
        category: 'flaw',
        rating: 2,
        origin: 'creation',
        parentSelectionId: null,
        details: {
          kind: 'enemy',
          identity: 'Rival',
        },
      },
    ],
  }
}

test(
  '057-E3A publica PATCH dedicado de revisión de Ventajas',
  () => {
    const handler =
      CharacterInitialVampireController
        .prototype.advantages

    assert.equal(
      Reflect.getMetadata('path', handler),
      ':characterId/initial-vampire/advantages',
    )
    assert.equal(
      Reflect.getMetadata('method', handler),
      RequestMethod.PATCH,
    )
  },
)

test(
  '057-E3A reutiliza el parser completo de Ventajas',
  () => {
    assert.deepEqual(
      parseReviewInitialAdvantagesRequest(
        characterId,
        {
          expectedRevision: 4,
          advantages: advantages(),
        },
      ),
      {
        characterId,
        expectedRevision: 4,
        advantages: advantages(),
      },
    )

    assert.throws(
      () =>
        parseReviewInitialAdvantagesRequest(
          characterId,
          {
            expectedRevision: 4,
            advantages: {
              selections: [
                {
                  ...advantages().selections[0],
                  origin: 'evolution',
                },
              ],
            },
          },
        ),
      InvalidInitialVampireResolutionRequestError,
    )
  },
)
