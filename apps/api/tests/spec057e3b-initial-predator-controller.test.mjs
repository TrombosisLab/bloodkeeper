import assert from 'node:assert/strict'
import test from 'node:test'
import 'reflect-metadata'

import {
  InvalidInitialVampireResolutionRequestError,
  parseAdoptInitialPredatorTypeRequest,
} from '../dist/characters/presentation/character-initial-vampire.dto.js'

const characterId =
  '33333333-3333-4333-8333-333333333333'

function body() {
  return {
    expectedRevision: 7,
    predatorTypeKey: 'bagger',
    predatorTypeChoices: {
      'bagger-specialty': 0,
      'bagger-discipline': 1,
    },
    disciplinePowerKey:
      'obfuscate-cloak-of-shadows',
    advantages: {
      selections: [
        {
          selectionId: 'predator-enemy',
          definitionKey: 'enemy',
          category: 'flaw',
          rating: 2,
          origin: 'predatorType',
          parentSelectionId: null,
          details: {
            kind: 'enemy',
            identity: 'Proveedor',
          },
        },
      ],
    },
  }
}

test(
  '057-E3B parser admite contrato dedicado',
  () => {
    const parsed =
      parseAdoptInitialPredatorTypeRequest(
        characterId,
        body(),
      )

    assert.equal(
      parsed.predatorTypeKey,
      'bagger',
    )
    assert.equal(
      parsed.disciplinePowerKey,
      'obfuscate-cloak-of-shadows',
    )
  },
)

test(
  '057-E3B parser rechaza campos extra',
  () => {
    assert.throws(
      () =>
        parseAdoptInitialPredatorTypeRequest(
          characterId,
          {
            ...body(),
            xp: 10,
          },
        ),
      InvalidInitialVampireResolutionRequestError,
    )
  },
)
