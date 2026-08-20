import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CharacterDiceResonanceAdapter,
} from '../dist/dice/application/character-dice-resonance.adapter.js'

import {
  DicePoolSelectionError,
  ExecuteCharacterDiceRollUseCase,
} from '../dist/dice/application/execute-character-dice-roll.use-case.js'

import {
  RecordCharacterDiceRollUseCase,
} from '../dist/dice/application/record-character-dice-roll.use-case.js'

function sequence(values) {
  let index = 0
  return {
    rollD10() {
      return values[index++]
    },
  }
}

function character(overrides = {}) {
  return {
    characterId: 'character-1',
    ownerId: 'owner-1',
    chronicleId: null,
    status: 'active',
    nature: 'vampire',
    revision: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
    identity: {},
    creation: {},
    attributes: {},
    blood: {
      bloodPotency: 1,
      hunger: 2,
      resonance: {
        sourceKind: 'human',
        resonanceKey: 'choleric',
        specialAffinityKey: null,
        temperament: 'intense',
      },
    },
    damage: {},
    skills: {},
    skillSpecialties: [],
    disciplines: [
      {
        disciplineKey: 'celerity',
        rating: 2,
        powerKeys: [],
        origin: null,
      },
      {
        disciplineKey: 'auspex',
        rating: 1,
        powerKeys: [],
        origin: null,
      },
    ],
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

function executorFor(value) {
  const resonance =
    new CharacterDiceResonanceAdapter(
      draftReader(value),
    )

  return new ExecuteCharacterDiceRollUseCase(
    {
      async execute() {
        return {
          attributes: {
            dexterity: 3,
          },
          skills: {
            athletics: 2,
          },
        }
      },
    },
    {
      async execute() {
        return {
          hunger:
            value.nature === 'human'
              ? 0
              : value.blood.hunger,
        }
      },
    },
    resonance,
    sequence([6, 7, 8, 9, 10, 6]),
  )
}

test('058-C preview deriva +1 backend para Disciplina asociada', async () => {
  const pool = await executorFor(
    character(),
  ).preview(
    'owner-1',
    {
      characterId: 'character-1',
      attribute: 'dexterity',
      skill: 'athletics',
      disciplineKey: 'celerity',
    },
  )

  assert.equal(pool.basePool, 5)
  assert.equal(pool.modifier, 1)
  assert.equal(pool.finalPool, 6)
  assert.deepEqual(
    pool.modifiers.map(
      ({ key, value }) => ({
        key,
        value,
      }),
    ),
    [
      {
        key: 'bloodResonance',
        value: 1,
      },
    ],
  )
  assert.match(
    pool.modifiers[0].label,
    /Resonancia:/,
  )
})

test('058-C contexto de Disciplina no añade su rating al pool', async () => {
  const pool = await executorFor(
    character(),
  ).preview(
    'owner-1',
    {
      characterId: 'character-1',
      attribute: 'dexterity',
      skill: 'athletics',
      disciplineKey: 'celerity',
    },
  )

  assert.equal(pool.basePool, 5)
  assert.deepEqual(
    pool.components.map(({ key }) => key),
    [
      'attribute:dexterity',
      'skill:athletics',
    ],
  )
})

test('058-C no aplica bonus a Disciplina no asociada y rechaza no poseída', async () => {
  const executor =
    executorFor(character())

  const unmatched =
    await executor.preview(
      'owner-1',
      {
        characterId: 'character-1',
        attribute: 'dexterity',
        skill: 'athletics',
        disciplineKey: 'auspex',
      },
    )

  assert.equal(unmatched.modifier, 0)
  assert.deepEqual(
    unmatched.modifiers,
    [],
  )

  await assert.rejects(
    executor.preview(
      'owner-1',
      {
        characterId: 'character-1',
        attribute: 'dexterity',
        skill: 'athletics',
        disciplineKey: 'presence',
      },
    ),
    DicePoolSelectionError,
  )
})

test('058-C combina modificador general existente sin duplicar la Resonancia', async () => {
  const pool = await executorFor(
    character(),
  ).preview(
    'owner-1',
    {
      characterId: 'character-1',
      attribute: 'dexterity',
      skill: 'athletics',
      disciplineKey: 'celerity',
      modifier: -1,
    },
  )

  assert.equal(pool.modifier, 0)
  assert.deepEqual(
    pool.modifiers.map(
      ({ key, value }) => [key, value],
    ),
    [
      ['general', -1],
      ['bloodResonance', 1],
    ],
  )
})

test('058-C Hambre 5 y humano no proyectan Resonancia activa', async () => {
  const hungerFive =
    new CharacterDiceResonanceAdapter(
      draftReader(
        character({
          blood: {
            bloodPotency: 1,
            hunger: 5,
            resonance: {
              sourceKind: 'human',
              resonanceKey: 'choleric',
              specialAffinityKey: null,
              temperament: 'intense',
            },
          },
        }),
      ),
    )

  assert.deepEqual(
    await hungerFive.execute(
      'owner-1',
      'character-1',
    ),
    {
      disciplineKeys: [
        'celerity',
        'auspex',
      ],
      resonance: null,
    },
  )

  const human =
    new CharacterDiceResonanceAdapter(
      draftReader(
        character({
          nature: 'human',
          blood: null,
          disciplines: [],
        }),
      ),
    )

  assert.deepEqual(
    await human.execute(
      'owner-1',
      'character-1',
    ),
    {
      disciplineKeys: [],
      resonance: null,
    },
  )
})

test('058-C historial conserva exactamente el modificador derivado', async () => {
  const executor =
    executorFor(character())
  const created = []

  const useCase =
    new RecordCharacterDiceRollUseCase(
      executor,
      {
        async execute() {
          return {
            chronicleId: null,
          }
        },
      },
      {
        async validate(input) {
          return {
            characterId:
              input.characterId,
            chronicleId: null,
            sessionId: null,
            visibility: 'contextual',
            rerollParentId: null,
          }
        },
      },
      {
        async create(data) {
          created.push(data)
          return {
            id: 'roll-058c',
            actorId: data.actorId,
            actorDisplayName: 'Owner',
            characterId:
              data.characterId,
            chronicleId:
              data.chronicleId,
            sessionId:
              data.sessionId,
            rerollParentId:
              data.rerollParentId,
            source: data.source,
            visibility:
              data.visibility,
            description:
              data.description,
            rulesVersion:
              data.rulesVersion,
            pool: data.pool,
            roll: data.roll,
            createdAt: new Date(),
          }
        },
      },
    )

  const record =
    await useCase.execute(
      'owner-1',
      {
        characterId: 'character-1',
        attribute: 'dexterity',
        skill: 'athletics',
        disciplineKey: 'celerity',
      },
    )

  assert.equal(created.length, 1)
  assert.deepEqual(
    created[0].pool.modifiers,
    record.pool.modifiers,
  )
  assert.equal(
    record.pool.modifiers[0].key,
    'bloodResonance',
  )
})
