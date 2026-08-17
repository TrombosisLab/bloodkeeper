import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CharacterDiceHungerAdapter,
  CharacterDiceStateError,
} from '../dist/dice/application/character-dice-hunger.adapter.js'

import {
  ExecuteCharacterDiceRollUseCase,
} from '../dist/dice/application/execute-character-dice-roll.use-case.js'

function sequence(values) {
  let index = 0

  return {
    rollD10() {
      const value = values[index]
      index += 1
      return value
    },
  }
}

function character(overrides = {}) {
  return {
    characterId: 'character-1',
    ownerId: 'owner-1',
    chronicleId: null,
    status: 'active',
    nature: 'human',
    revision: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    identity: {},
    creation: {},
    attributes: {},
    blood: null,
    damage: {},
    skills: {},
    skillSpecialties: [],
    disciplines: [],
    bloodSorceryRituals: {},
    oblivionCeremonies: {},
    thinBloodAlchemy: null,
    thinBloodTraits: [],
    advantages: {},
    humanity: {},
    ...overrides,
  }
}

function draftReader(value) {
  return {
    async execute(ownerId, characterId) {
      return (
        ownerId === 'owner-1' &&
        characterId === 'character-1'
      )
        ? value
        : null
    },
  }
}

test(
  '057-F1 humano sin Blood proyecta Hambre efectiva cero sólo para Dados',
  async () => {
    const adapter =
      new CharacterDiceHungerAdapter(
        draftReader(character()),
      )

    const result = await adapter.execute(
      'owner-1',
      'character-1',
    )

    assert.deepEqual(result, {
      hunger: 0,
    })
    assert.equal(
      Object.isFrozen(result),
      true,
    )
  },
)

test(
  '057-F1 tirada humana usa exclusivamente dados normales',
  async () => {
    const hunger =
      new CharacterDiceHungerAdapter(
        draftReader(character()),
      )

    const useCase =
      new ExecuteCharacterDiceRollUseCase(
        {
          async execute() {
            return {
              attributes: {
                dexterity: 3,
              },
              skills: {
                stealth: 2,
              },
            }
          },
        },
        hunger,
        sequence([6, 7, 8, 9, 10]),
      )

    const result = await useCase.execute(
      'owner-1',
      {
        characterId: 'character-1',
        attribute: 'dexterity',
        skill: 'stealth',
      },
    )

    assert.equal(
      result.pool.finalPool,
      5,
    )
    assert.equal(
      result.pool.normalDice,
      5,
    )
    assert.equal(
      result.pool.hungerDice,
      0,
    )
    assert.deepEqual(
      result.roll.dice.map(
        (die) => die.type,
      ),
      [
        'normal',
        'normal',
        'normal',
        'normal',
        'normal',
      ],
    )
  },
)

test(
  '057-F1 vampiro conserva Hambre persistida y comportamiento previo',
  async () => {
    const adapter =
      new CharacterDiceHungerAdapter(
        draftReader(
          character({
            nature: 'vampire',
            blood: {
              bloodPotency: 1,
              hunger: 2,
            },
          }),
        ),
      )

    assert.deepEqual(
      await adapter.execute(
        'owner-1',
        'character-1',
      ),
      {
        hunger: 2,
      },
    )
  },
)

test(
  '057-F1 no maquilla estados incompatibles humano/vampiro',
  async () => {
    const humanWithBlood =
      new CharacterDiceHungerAdapter(
        draftReader(
          character({
            blood: {
              bloodPotency: 1,
              hunger: 1,
            },
          }),
        ),
      )

    await assert.rejects(
      humanWithBlood.execute(
        'owner-1',
        'character-1',
      ),
      CharacterDiceStateError,
    )

    const vampireWithoutBlood =
      new CharacterDiceHungerAdapter(
        draftReader(
          character({
            nature: 'vampire',
            blood: null,
          }),
        ),
      )

    await assert.rejects(
      vampireWithoutBlood.execute(
        'owner-1',
        'character-1',
      ),
      CharacterDiceStateError,
    )
  },
)

test(
  '057-F1 conserva aislamiento de personaje ausente o ajeno',
  async () => {
    const adapter =
      new CharacterDiceHungerAdapter(
        draftReader(character()),
      )

    assert.equal(
      await adapter.execute(
        'foreign-owner',
        'character-1',
      ),
      null,
    )
  },
)
