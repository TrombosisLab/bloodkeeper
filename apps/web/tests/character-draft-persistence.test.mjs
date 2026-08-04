import assert from 'node:assert/strict'
import test from 'node:test'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  CharacterDraftApiError,
} from '../src/features/character-creation/infrastructure/character-draft.api.ts'

import {
  loadCharacterDraftEditorState,
  persistCharacterDraftEditorState,
  stateForCharacterDraftPersistenceError,
} from '../src/features/character-creation/domain/character-draft-persistence.ts'

function snapshot(overrides = {}) {
  return {
    characterId: 'character-1',
    ownerId: 'owner-1',
    chronicleId: null,
    status: 'draft',
    revision: 1,
    createdAt: '2026-08-04T09:00:00.000Z',
    updatedAt: '2026-08-04T09:00:00.000Z',
    identity: {
      name: 'Alicia',
      concept: null,
      predatorTypeKey: null,
      ambition: null,
      clanKey: null,
      sire: null,
      desire: null,
      generation: null,
    },
    creation: {
      schemaVersion: 1,
      currentStep: 'identity',
      skillDistributionMethod: 'balanced',
      predatorTypeChoices: {},
      updatedAt: '2026-08-04T09:00:00.000Z',
    },
    attributes: {
      ...initialCharacterDraft.attributes,
    },
    blood: {
      ...initialCharacterDraft.blood,
    },
    damage: {
      health: {
        superficial: 0,
        aggravated: 0,
      },
      willpower: {
        superficial: 0,
        aggravated: 0,
      },
    },
    skills: {
      ...initialCharacterDraft.skills,
    },
    skillSpecialties: [],
    disciplines: [],
    bloodSorceryRituals: {
      ritualKeys: [],
    },
    oblivionCeremonies: {
      ceremonyKeys: [],
    },
    thinBloodAlchemy: {
      rating: 0,
      method: null,
      formulaKeys: [],
    },
    thinBloodTraits: [],
    advantages: {
      selections: [],
    },
    humanity: {
      value: 7,
      stains: 0,
      convictions: [],
      touchstones: [],
    },
    ...overrides,
  }
}

test(
  '004-E.2B carga un borrador y recupera revisión y paso',
  async () => {
    const state =
      await loadCharacterDraftEditorState(
        {
          async load(id) {
            assert.equal(id, 'character-1')
            return snapshot({
              revision: 4,
              creation: {
                ...snapshot().creation,
                currentStep: 'skills',
              },
            })
          },
          async create() {
            throw new Error('unexpected')
          },
          async update() {
            throw new Error('unexpected')
          },
        },
        'character-1',
      )

    assert.equal(state.revision, 4)
    assert.equal(state.currentStepId, 'skills')
  },
)

test(
  '004-E.2B crea y después actualiza usando revisión optimista',
  async () => {
    const calls = []
    const draft =
      structuredClone(initialCharacterDraft)

    draft.identity.name = 'Alicia'

    const gateway = {
      async load() {
        throw new Error('unexpected')
      },
      async create(request) {
        calls.push(['create', request])
        return snapshot()
      },
      async update(id, request) {
        calls.push(['update', id, request])
        return snapshot({ revision: 2 })
      },
    }

    const created =
      await persistCharacterDraftEditorState(
        gateway,
        draft,
        'identity',
        null,
      )

    const updated =
      await persistCharacterDraftEditorState(
        gateway,
        created.draft,
        'attributes',
        created,
      )

    assert.equal(
      calls[0][1].creation.currentStep,
      'identity',
    )
    assert.equal(calls[1][1], 'character-1')
    assert.equal(
      calls[1][2].expectedRevision,
      1,
    )
    assert.equal(
      calls[1][2].creation.currentStep,
      'attributes',
    )
    assert.equal(updated.revision, 2)
  },
)

test(
  '004-E.2B clasifica sesión ausencia conflicto y rechazo',
  () => {
    assert.equal(
      stateForCharacterDraftPersistenceError(
        new CharacterDraftApiError(401, 'AUTH'),
      ),
      'unauthorized',
    )
    assert.equal(
      stateForCharacterDraftPersistenceError(
        new CharacterDraftApiError(404, 'MISSING'),
      ),
      'not-found',
    )
    assert.equal(
      stateForCharacterDraftPersistenceError(
        new CharacterDraftApiError(409, 'CONFLICT'),
      ),
      'conflict',
    )
    assert.equal(
      stateForCharacterDraftPersistenceError(
        new CharacterDraftApiError(422, 'REJECTED'),
      ),
      'rejected',
    )
  },
)
