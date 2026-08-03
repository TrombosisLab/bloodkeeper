import assert from 'node:assert/strict'
import test from 'node:test'

import {
  parseCharacterLifecycleRequest,
} from '../dist/characters/presentation/character-lifecycle.dto.js'

test(
  '029-G acepta destinos y revision explicitos',
  () => {
    assert.deepEqual(
      parseCharacterLifecycleRequest(
        'character-029-g',
        {
          expectedRevision: 7,
          nextStatus: 'active',
          confirmed: false,
        },
      ),
      {
        characterId: 'character-029-g',
        expectedRevision: 7,
        nextStatus: 'active',
        confirmed: false,
      },
    )

    assert.equal(
      parseCharacterLifecycleRequest(
        'character-029-g',
        {
          expectedRevision: 8,
          nextStatus: 'archived',
          confirmed: true,
        },
      ).nextStatus,
      'archived',
    )
  },
)

test(
  '029-G no permite solicitar el estado borrador',
  () => {
    for (const nextStatus of [
      'draft',
      'unknown',
      null,
    ]) {
      assert.throws(
        () =>
          parseCharacterLifecycleRequest(
            'character-029-g',
            {
              expectedRevision: 1,
              nextStatus,
              confirmed: false,
            },
          ),
        {
          name:
            'InvalidCharacterLifecycleRequestError',
        },
      )
    }
  },
)

test(
  '029-G exige revision positiva y confirmacion booleana',
  () => {
    for (const body of [
      {
        expectedRevision: 0,
        nextStatus: 'active',
        confirmed: false,
      },
      {
        expectedRevision: 1.5,
        nextStatus: 'active',
        confirmed: false,
      },
      {
        expectedRevision: 1,
        nextStatus: 'active',
      },
      {
        expectedRevision: 1,
        nextStatus: 'archived',
        confirmed: 'yes',
      },
    ]) {
      assert.throws(
        () =>
          parseCharacterLifecycleRequest(
            'character-029-g',
            body,
          ),
        {
          name:
            'InvalidCharacterLifecycleRequestError',
        },
      )
    }
  },
)

test(
  '029-G rechaza campos de control no reconocidos',
  () => {
    assert.throws(
      () =>
        parseCharacterLifecycleRequest(
          'character-029-g',
          {
            expectedRevision: 1,
            nextStatus: 'active',
            confirmed: false,
            authorized: true,
          },
        ),
      {
        name:
          'InvalidCharacterLifecycleRequestError',
      },
    )
  },
)
