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
  'SPEC-027.E acepta Hambre en el estado operativo',
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
          hunger: 3,
        },
      )

    assert.equal(parsed.characterId, characterId)
    assert.equal(parsed.expectedRevision, 4)
    assert.equal(parsed.humanityValue, 6)
    assert.equal(parsed.humanityStains, 2)
    assert.equal(parsed.hunger, 3)
    assert.equal(
      parsed.damage.health.superficial,
      2,
    )
  },
)

test(
  'SPEC-027.E rechaza cambios vacíos y Hambre no entera',
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
            hunger: 2.5,
          },
        ),
      InvalidCharacterStateRequestError,
    )
},
)

test(
  'SPEC-027.E serializa también Hambre en el estado operativo',
  () => {
    const response =
      toCharacterStateResponse({
        characterId,
        revision: 7,
        status: 'active',
        blood: {
          hunger: 3,
        },
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
      hunger: 3,
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
