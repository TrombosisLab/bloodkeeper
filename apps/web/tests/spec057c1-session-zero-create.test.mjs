import assert from 'node:assert/strict'
import test from 'node:test'

import {initialCharacterDraft}
  from '../src/features/character-creation/data/initial-character-draft.ts'
import {
  mapCharacterDraftApiSnapshotToEditorState,
  mapCharacterDraftToCreateRequest,
  mapCharacterDraftToUpdateRequest,
} from '../src/features/character-creation/domain/character-draft-api.mapper.ts'
import {persistCharacterDraftEditorState}
  from '../src/features/character-creation/domain/character-draft-persistence.ts'
import {
  CharacterDraftApiError,
  parseCharacterDraftApiSnapshotResponse,
} from '../src/features/character-creation/infrastructure/character-draft.api.ts'

function snapshot(overrides = {}) {
  return {
    characterId:
      '39c1801e-68fe-4c92-8795-723cac284bdf',
    ownerId:
      '3bbc46f8-a45f-4589-9872-129e6652082c',
    chronicleId: null,
    status: 'draft',
    nature: 'human',
    revision: 1,
    createdAt: '2026-08-16T18:00:00.000Z',
    updatedAt: '2026-08-16T18:00:00.000Z',
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
    creation: {
      schemaVersion: 1,
      currentStep: 'identity',
      creationMode: 'sessionZero',
      skillDistributionMethod: 'balanced',
      predatorTypeChoices: {},
      updatedAt: '2026-08-16T18:00:00.000Z',
    },
    attributes: {...initialCharacterDraft.attributes},
    blood: null,
    damage: {
      health: {superficial: 0, aggravated: 0},
      willpower: {superficial: 0, aggravated: 0},
    },
    skills: {...initialCharacterDraft.skills},
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
    ...overrides,
  }
}

test('057-C1 mapper crea payload humano limpio', () => {
  const request =
    mapCharacterDraftToCreateRequest(
      structuredClone(initialCharacterDraft),
      {
        currentStepId: 'identity',
        creationMode: 'sessionZero',
      },
    )

  assert.equal(request.creation.creationMode, 'sessionZero')
  assert.equal(request.blood, null)
  assert.equal(request.thinBloodAlchemy, null)
  assert.deepEqual(request.disciplines, [])
  assert.deepEqual(request.creation.predatorTypeChoices, {})
  assert.equal(request.identity.clanKey, null)
  assert.equal(request.identity.generation, null)
})

test('057-C1 PATCH humano omite campos vampíricos', () => {
  const request =
    mapCharacterDraftToUpdateRequest(
      structuredClone(initialCharacterDraft),
      {
        expectedRevision: 1,
        currentStepId: 'identity',
        creationMode: 'sessionZero',
        chronicleId: null,
        humanityStains: 0,
      },
    )

  assert.equal(Object.hasOwn(request, 'blood'), false)
  assert.equal(Object.hasOwn(request, 'disciplines'), false)
  assert.equal(
    Object.hasOwn(request, 'thinBloodAlchemy'),
    false,
  )
  assert.equal(
    Object.hasOwn(request.creation, 'creationMode'),
    false,
  )
})

test('057-C1 parser exige coherencia nature/relaciones', () => {
  const parsed =
    parseCharacterDraftApiSnapshotResponse(snapshot())

  assert.equal(parsed.nature, 'human')
  assert.equal(parsed.blood, null)

  assert.throws(
    () =>
      parseCharacterDraftApiSnapshotResponse(
        snapshot({
          blood: {bloodPotency: 1, hunger: 1},
        }),
      ),
    CharacterDraftApiError,
  )

  assert.throws(
    () =>
      parseCharacterDraftApiSnapshotResponse({
        ...snapshot(),
        nature: 'vampire',
      }),
    CharacterDraftApiError,
  )
})

test('057-C1 reanuda humano sin persistir defaults locales', () => {
  const state =
    mapCharacterDraftApiSnapshotToEditorState(snapshot())

  assert.equal(state.nature, 'human')
  assert.equal(state.creationMode, 'sessionZero')
  assert.deepEqual(
    state.draft.blood,
    initialCharacterDraft.blood,
  )
})

test('057-C1 persistencia inicial conserva el modo', async () => {
  let captured = null
  const gateway = {
    async create(request) {
      captured = request
      return snapshot()
    },
  }

  const state =
    await persistCharacterDraftEditorState(
      gateway,
      structuredClone(initialCharacterDraft),
      'identity',
      null,
      'sessionZero',
    )

  assert.equal(captured.creation.creationMode, 'sessionZero')
  assert.equal(captured.blood, null)
  assert.equal(state.nature, 'human')
  assert.equal(state.creationMode, 'sessionZero')
})
