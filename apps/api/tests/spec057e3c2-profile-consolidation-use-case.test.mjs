import assert from 'node:assert/strict'
import test from 'node:test'
import {
  InitialVampireProfileIncompleteError,
  ResolveInitialVampireStateUseCase,
  deriveInitialVampireProfileConsolidationHistoryEntryId,
} from '../dist/characters/application/resolve-initial-vampire-state.use-case.js'
import {
  characterRulesCatalog,
} from '../dist/characters/domain/character-rules-catalog.js'

const ownerId = '11111111-1111-4111-8111-111111111111'
const otherOwnerId = '99999999-9999-4999-8999-999999999999'
const characterId = '22222222-2222-4222-8222-222222222222'

function currentCharacter() {
  return {
    characterId,
    ownerId,
    chronicleId: null,
    status: 'active',
    nature: 'vampire',
    revision: 8,
    identity: {
      name: 'Consolidación',
      concept: 'E3-C2',
      predatorTypeKey: 'bagger',
      ambition: null,
      clanKey: 'brujah',
      sire: null,
      desire: null,
      generation: 13,
      ageCategory: null,
    },
    creation: {
      schemaVersion: 1,
      creationMode: 'sessionZero',
      currentStep: 'review',
      skillDistributionMethod: 'balanced',
      predatorTypeChoices: {},
      updatedAt: new Date(),
    },
    attributes: {
      strength: 4, dexterity: 3, stamina: 3,
      charisma: 3, manipulation: 2, composure: 2,
      intelligence: 2, wits: 2, resolve: 1,
    },
    blood: { bloodPotency: 1, hunger: 1 },
    damage: {
      health: { superficial: 0, aggravated: 0 },
      willpower: { superficial: 0, aggravated: 0 },
    },
    skills: {},
    skillSpecialties: [],
    disciplines: [
      {
        disciplineKey: 'potence',
        rating: 2,
        powerKeys: ['potence-lethal-body', 'potence-soaring-leap'],
        origin: 'creation',
      },
      {
        disciplineKey: 'presence',
        rating: 1,
        powerKeys: ['presence-awe'],
        origin: 'creation',
      },
    ],
    bloodSorceryRituals: { ritualKeys: [] },
    oblivionCeremonies: { ceremonyKeys: [] },
    thinBloodAlchemy: null,
    thinBloodTraits: [],
    advantages: { selections: [] },
    humanity: {
      value: 7, stains: 0,
      convictions: [], touchstones: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function validation(valid) {
  return {
    context: 'activation',
    valid,
    canProceed: valid,
    sections: [],
    issues: valid ? [] : [
      {
        code: 'PROFILE_INCOMPLETE',
        severity: 'error',
        section: 'dependencies',
        field: null,
        message: 'incomplete',
      },
    ],
  }
}

function setup(valid = true) {
  let current = currentCharacter()
  let writes = 0
  let lastWrite = null
  const validationCalls = []
  const repository = {
    async findByCharacterId() { return current },
    async consolidateInitialVampireProfile(data) {
      writes += 1
      lastWrite = data
      current = { ...current, revision: current.revision + 1 }
      return current
    },
  }
  const validator = {
    validate(character, context) {
      validationCalls.push([character.characterId, context])
      return validation(valid)
    },
  }
  return {
    useCase: new ResolveInitialVampireStateUseCase(
      repository,
      { async findActiveMembership() { throw new Error('unused') } },
      characterRulesCatalog,
      validator,
    ),
    writes: () => writes,
    lastWrite: () => lastWrite,
    validationCalls,
  }
}

test('057-E3C2 consolida sólo tras activation estricta', async () => {
  const f = setup(true)
  const result = await f.useCase.consolidateProfile(
    ownerId,
    { characterId, expectedRevision: 8 },
  )
  assert.equal(f.writes(), 1)
  assert.equal(result.phase, 'ESTABLISHED_VAMPIRE')
  assert.equal(result.character.revision, 9)
  assert.deepEqual(f.validationCalls, [[characterId, 'activation']])
  assert.match(f.lastWrite().historyEntryId, /^[0-9a-f-]{36}$/i)
  assert.equal(result.pendingDecisions.includes('sire'), true)
})

test('057-E3C2 incompleto no escribe', async () => {
  const f = setup(false)
  await assert.rejects(
    f.useCase.consolidateProfile(
      ownerId,
      { characterId, expectedRevision: 8 },
    ),
    InitialVampireProfileIncompleteError,
  )
  assert.equal(f.writes(), 0)
})

test('057-E3C2 conserva autorización backend', async () => {
  const f = setup(true)
  await assert.rejects(
    f.useCase.consolidateProfile(
      otherOwnerId,
      { characterId, expectedRevision: 8 },
    ),
  )
  assert.equal(f.writes(), 0)
})

test(
  '057-E3C2 deriva un UUID técnico estable por personaje',
  () => {
    const first =
      deriveInitialVampireProfileConsolidationHistoryEntryId(
        characterId,
      )
    const repeated =
      deriveInitialVampireProfileConsolidationHistoryEntryId(
        characterId,
      )
    const other =
      deriveInitialVampireProfileConsolidationHistoryEntryId(
        '44444444-4444-4444-8444-444444444444',
      )

    assert.equal(first, repeated)
    assert.notEqual(first, other)
    assert.match(
      first,
      /^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
  },
)
