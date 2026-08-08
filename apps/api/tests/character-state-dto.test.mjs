import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InvalidCharacterStateRequestError,
  parseUpdateCharacterStateRequest,
  toCharacterStateResponse,
} from '../dist/characters/presentation/character-state.dto.js'

const characterId =
  '39c1801e-68fe-4c92-8795-723cac284bdf'

test(
  'SPEC-024 acepta exclusivamente daño y Humanidad/Manchas',
  () => {
    const parsed =
      parseUpdateCharacterStateRequest(
        characterId,
        {
          expectedRevision: 4,
          damage: {
            health: {
              superficial: 2,
              aggravated: 1,
            },
            willpower: {
              superficial: 1,
              aggravated: 0,
            },
          },
          humanityValue: 6,
          humanityStains: 2,
        },
      )

    assert.equal(parsed.characterId, characterId)
    assert.equal(parsed.expectedRevision, 4)
    assert.equal(parsed.humanityValue, 6)
    assert.equal(parsed.humanityStains, 2)
    assert.equal(
      parsed.damage.health.superficial,
      2,
    )
  },
)

test(
  'SPEC-024 rechaza cambios vacíos y Hambre en este contrato',
  () => {
    assert.throws(
      () =>
        parseUpdateCharacterStateRequest(
          characterId,
          { expectedRevision: 1 },
        ),
      InvalidCharacterStateRequestError,
    )

    assert.throws(
      () =>
        parseUpdateCharacterStateRequest(
          characterId,
          {
            expectedRevision: 1,
            hunger: 3,
          },
        ),
      /hunger is not allowed/,
    )
  },
)

test(
  'SPEC-024 serializa sólo el estado operativo necesario',
  () => {
    const response =
      toCharacterStateResponse({
        characterId,
        revision: 7,
        status: 'active',
        damage: {
          health: {
            superficial: 2,
            aggravated: 0,
          },
          willpower: {
            superficial: 1,
            aggravated: 1,
          },
        },
        humanity: {
          value: 6,
          stains: 2,
        },
      })

    assert.deepEqual(response, {
      characterId,
      revision: 7,
      status: 'active',
      damage: {
        health: {
          superficial: 2,
          aggravated: 0,
        },
        willpower: {
          superficial: 1,
          aggravated: 1,
        },
      },
      humanity: {
        value: 6,
        stains: 2,
      },
    })
  },
)
