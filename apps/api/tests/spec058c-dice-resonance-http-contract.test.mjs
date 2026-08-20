import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InvalidDiceRollRequestError,
  parseCharacterDiceRollRequest,
  parseManualDiceRollRequest,
} from '../dist/dice/presentation/dice.dto.js'

const characterId =
  '39c1801e-68fe-4c92-8795-723cac284bdf'

test('058-C DTO acepta disciplineKey sólo como contexto de personaje', () => {
  assert.deepEqual(
    parseCharacterDiceRollRequest(
      characterId,
      {
        attribute: 'dexterity',
        skill: 'athletics',
        disciplineKey: 'celerity',
      },
    ),
    {
      characterId,
      attribute: 'dexterity',
      skill: 'athletics',
      disciplineKey: 'celerity',
      modifier: undefined,
      difficulty: undefined,
    },
  )

  assert.throws(
    () =>
      parseManualDiceRollRequest({
        pool: 3,
        hunger: 1,
        disciplineKey: 'celerity',
      }),
    InvalidDiceRollRequestError,
  )
})

test('058-C cliente no puede inyectar el modificador reservado bloodResonance', () => {
  for (const parse of [
    () =>
      parseCharacterDiceRollRequest(
        characterId,
        {
          attribute: 'dexterity',
          modifiers: [
            {
              key: 'bloodResonance',
              label: 'Resonancia',
              value: 1,
            },
          ],
        },
      ),
    () =>
      parseManualDiceRollRequest({
        pool: 3,
        hunger: 1,
        modifiers: [
          {
            key: 'bloodResonance',
            label: 'Resonancia',
            value: 1,
          },
        ],
      }),
  ]) {
    assert.throws(
      parse,
      InvalidDiceRollRequestError,
    )
  }
})
