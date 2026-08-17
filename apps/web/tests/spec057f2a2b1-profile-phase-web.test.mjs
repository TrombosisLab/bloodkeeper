import assert from 'node:assert/strict'
import test from 'node:test'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  parseCharacterDraftApiSnapshotResponse,
} from '../src/features/character-creation/infrastructure/character-draft.api.ts'

import {
  CharacterProfilePhaseApiError,
  createCharacterProfilePhaseGateway,
  parseCharacterProfilePhaseResponse,
} from '../src/features/character-sheet/infrastructure/character-profile-phase.api.ts'

const characterId =
  '11111111-1111-4111-8111-111111111111'

function response({
  ok = true,
  status = 200,
  body,
}) {
  return {
    ok,
    status,
    async json() {
      return structuredClone(body)
    },
  }
}

function snapshot({
  nature = 'vampire',
  creationMode = 'sessionZero',
  blood = null,
  thinBloodAlchemy = null,
} = {}) {
  return {
    characterId,
    ownerId:
      '22222222-2222-4222-8222-222222222222',
    chronicleId: null,
    status: 'active',
    nature,
    revision: 7,
    createdAt:
      '2026-08-17T10:00:00.000Z',
    updatedAt:
      '2026-08-17T11:00:00.000Z',
    identity: {
      name: 'Alicia',
      concept: 'Investigadora',
      predatorTypeKey: null,
      ambition: null,
      clanKey: null,
      sire: null,
      desire: null,
      generation: null,
      ageCategory: 'neonate',
    },
    creation: {
      schemaVersion: 1,
      currentStep: 'review',
      creationMode,
      skillDistributionMethod:
        'balanced',
      predatorTypeChoices: {},
      updatedAt:
        '2026-08-17T11:00:00.000Z',
    },
    attributes: {
      ...initialCharacterDraft.attributes,
    },
    blood,
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
    thinBloodAlchemy,
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
  }
}

test(
  '057-F2A2B1 acepta las tres fases canónicas',
  () => {
    for (
      const phase of [
        'HUMAN',
        'TRANSITIONAL_VAMPIRE',
        'ESTABLISHED_VAMPIRE',
      ]
    ) {
      assert.deepEqual(
        parseCharacterProfilePhaseResponse({ phase, pendingDecisions: [] }),
        { phase, pendingDecisions: [] },
      )
    }
  },
)

test(
  '057-F2A2B1 rechaza fase inventada',
  () => {
    assert.throws(
      () =>
        parseCharacterProfilePhaseResponse({
          phase: 'HALF_VAMPIRE',
        }),
      CharacterProfilePhaseApiError,
    )
  },
)

test(
  '057-F2A2B1 consulta el endpoint backend canónico',
  async () => {
    const calls = []

    const gateway =
      createCharacterProfilePhaseGateway(
        async (url, options) => {
          calls.push([url, options])

          return response({
            body: {
        phase:
          'TRANSITIONAL_VAMPIRE',
        pendingDecisions: [],
      },
          })
        },
      )

    assert.deepEqual(
      await gateway.load(characterId),
      {
        phase:
          'TRANSITIONAL_VAMPIRE',
        pendingDecisions: [],
      },
    )

    assert.equal(
      calls[0][0],
      `/api/characters/${characterId}/profile-phase`,
    )

    assert.equal(
      calls[0][1].credentials,
      'include',
    )
  },
)

test(
  '057-F2A2B1 conserva errores estructurados del endpoint de fase',
  async () => {
    const gateway =
      createCharacterProfilePhaseGateway(
        async () =>
          response({
            ok: false,
            status: 422,
            body: {
              code:
                'CHARACTER_PROFILE_PHASE_UNAVAILABLE',
            },
          }),
      )

    await assert.rejects(
      gateway.load(characterId),
      (error) => {
        assert.ok(
          error instanceof
            CharacterProfilePhaseApiError,
        )
        assert.equal(
          error.status,
          422,
        )
        assert.equal(
          error.code,
          'CHARACTER_PROFILE_PHASE_UNAVAILABLE',
        )
        return true
      },
    )
  },
)

test(
  '057-F2A2B1 permite snapshot de vampiro Session Zero transitorio sin Blood',
  () => {
    const parsed =
      parseCharacterDraftApiSnapshotResponse(
        snapshot(),
      )

    assert.equal(
      parsed.nature,
      'vampire',
    )
    assert.equal(
      parsed.creation.creationMode,
      'sessionZero',
    )
    assert.equal(
      parsed.blood,
      null,
    )
    assert.equal(
      parsed.thinBloodAlchemy,
      null,
    )
  },
)

test(
  '057-F2A2B1 conserva STANDARD vampírico estricto',
  () => {
    assert.throws(
      () =>
        parseCharacterDraftApiSnapshotResponse(
          snapshot({
            creationMode: 'standard',
          }),
        ),
    )
  },
)

test(
  '057-F2A2B1 conserva HUMAN sin estados vampíricos',
  () => {
    const parsed =
      parseCharacterDraftApiSnapshotResponse(
        snapshot({
          nature: 'human',
          creationMode: 'sessionZero',
        }),
      )

    assert.equal(
      parsed.nature,
      'human',
    )
    assert.equal(
      parsed.blood,
      null,
    )
  },
)

test(
  '057-F2A3B2B2B profile phase consume pendingDecisions autoritativos',
  () => {
    assert.deepEqual(
      parseCharacterProfilePhaseResponse({
        phase:
          'TRANSITIONAL_VAMPIRE',
        pendingDecisions: [
          'clan',
          'generation',
          'sire',
          'bloodState',
        ],
      }),
      {
        phase:
          'TRANSITIONAL_VAMPIRE',
        pendingDecisions: [
          'clan',
          'generation',
          'sire',
          'bloodState',
        ],
      },
    )

    assert.throws(
      () =>
        parseCharacterProfilePhaseResponse({
          phase:
            'TRANSITIONAL_VAMPIRE',
          pendingDecisions: [
            'clan',
            'inventedDecision',
          ],
        }),
      CharacterProfilePhaseApiError,
    )

    assert.throws(
      () =>
        parseCharacterProfilePhaseResponse({
          phase:
            'ESTABLISHED_VAMPIRE',
          pendingDecisions: [
            'clan',
          ],
        }),
      CharacterProfilePhaseApiError,
    )
  },
)
