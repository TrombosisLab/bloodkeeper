import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CreateCharacterDraftUseCase,
} from '../dist/characters/application/create-character-draft.use-case.js'
import {
  parseCreateCharacterDraftRequest,
  parseUpdateCharacterDraftRequest,
} from '../dist/characters/presentation/character-draft.dto.js'
import {
  CHARACTER_SKILL_KEYS,
} from '../dist/characters/domain/persisted-character.types.js'

const ownerId =
  '3bbc46f8-a45f-4589-9872-129e6652082c'
const characterId =
  '39c1801e-68fe-4c92-8795-723cac284bdf'

function body() {
  return {
    chronicleId: null,
    identity: {
      name: 'Humano C1',
      concept: 'Investigador mortal',
      predatorTypeKey: null,
      ambition: null,
      clanKey: null,
      sire: null,
      desire: null,
      generation: null,
      ageCategory: null,
    },
    attributes: {
      strength: 1,
      dexterity: 1,
      stamina: 1,
      charisma: 1,
      manipulation: 1,
      composure: 1,
      intelligence: 1,
      wits: 1,
      resolve: 1,
    },
    blood: null,
    skills: Object.fromEntries(
      CHARACTER_SKILL_KEYS.map(key => [key, 0]),
    ),
    skillSpecialties: [],
    disciplines: [],
    bloodSorceryRituals: {ritualKeys: []},
    oblivionCeremonies: {ceremonyKeys: []},
    thinBloodAlchemy: null,
    thinBloodTraits: [],
    advantages: {selections: []},
    humanity: {
      value: 7,
      stains: 0,
      convictions: [],
      touchstones: [],
    },
    creation: {
      creationMode: 'sessionZero',
      currentStep: 'identity',
      skillDistributionMethod: 'balanced',
      predatorTypeChoices: {},
    },
  }
}

test('057-C1 acepta SESSION_ZERO controlado', () => {
  const parsed =
    parseCreateCharacterDraftRequest(ownerId, body())

  assert.equal(parsed.creation.creationMode, 'sessionZero')
  assert.equal(parsed.blood, null)
  assert.equal(parsed.thinBloodAlchemy, null)

  assert.throws(
    () =>
      parseCreateCharacterDraftRequest(
        ownerId,
        {...body(), nature: 'human'},
      ),
    /body\.nature is not allowed/,
  )
})

test('057-C1 creationMode sigue prohibido en PATCH genérico', () => {
  assert.throws(
    () =>
      parseUpdateCharacterDraftRequest(
        characterId,
        {
          expectedRevision: 1,
          creation: {creationMode: 'sessionZero'},
        },
      ),
    /body\.creation\.creationMode is not allowed/,
  )
})

test('057-C1 rechaza sangre en alta humana', () => {
  assert.throws(
    () =>
      parseCreateCharacterDraftRequest(
        ownerId,
        {
          ...body(),
          blood: {bloodPotency: 1, hunger: 1},
        },
      ),
    /creationMode is not allowed with vampire state/,
  )
})

test('057-C1 use case no exige Hambre al humano', async () => {
  let captured = null
  const repository = {
    async create(data) {
      captured = data
      return {ok: true}
    },
  }
  const useCase =
    new CreateCharacterDraftUseCase(repository)
  const result =
    await useCase.execute(
      parseCreateCharacterDraftRequest(ownerId, body()),
    )

  assert.equal(result.ok, true)
  assert.equal(captured.blood, null)
})
