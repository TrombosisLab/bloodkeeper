import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CharacterDraftApiError,
  createCharacterDraftGateway,
  parseCharacterDraftApiSnapshotResponse,
} from '../src/features/character-creation/infrastructure/character-draft.api.ts'

const characterId =
  '39c1801e-68fe-4c92-8795-723cac284bdf'

const ownerId =
  '3bbc46f8-a45f-4589-9872-129e6652082c'

const attributeKeys = [
  'strength',
  'dexterity',
  'stamina',
  'charisma',
  'manipulation',
  'composure',
  'intelligence',
  'wits',
  'resolve',
]

const skillKeys = [
  'athletics',
  'brawl',
  'craft',
  'drive',
  'firearms',
  'larceny',
  'melee',
  'stealth',
  'survival',
  'animalKen',
  'etiquette',
  'insight',
  'intimidation',
  'leadership',
  'performance',
  'persuasion',
  'streetwise',
  'subterfuge',
  'academics',
  'awareness',
  'finance',
  'investigation',
  'medicine',
  'occult',
  'politics',
  'science',
  'technology',
]

function snapshot(overrides = {}) {
  return {
    characterId,
    ownerId,
    chronicleId: null,
    status: 'draft',
    revision: 1,
    createdAt:
      '2026-08-04T09:00:00.000Z',
    updatedAt:
      '2026-08-04T09:00:00.000Z',
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
      updatedAt:
        '2026-08-04T09:00:00.000Z',
    },
    attributes: Object.fromEntries(
      attributeKeys.map(
        (key) => [key, 1],
      ),
    ),
    blood: {
      bloodPotency: 1,
      hunger: 1,
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
    skills: Object.fromEntries(
      skillKeys.map(
        (key) => [key, 0],
      ),
    ),
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

function createRequest() {
  const value = snapshot()

  return {
    chronicleId: value.chronicleId,
    identity: value.identity,
    attributes: value.attributes,
    blood: value.blood,
    skills: value.skills,
    skillSpecialties:
      value.skillSpecialties,
    disciplines: value.disciplines,
    bloodSorceryRituals:
      value.bloodSorceryRituals,
    oblivionCeremonies:
      value.oblivionCeremonies,
    thinBloodAlchemy:
      value.thinBloodAlchemy,
    thinBloodTraits:
      value.thinBloodTraits,
    advantages: value.advantages,
    humanity: value.humanity,
    creation: {
      currentStep:
        value.creation.currentStep,
      skillDistributionMethod:
        value.creation
          .skillDistributionMethod,
      predatorTypeChoices:
        value.creation
          .predatorTypeChoices,
    },
  }
}

function jsonResponse(
  body,
  {
    ok = true,
    status = 200,
  } = {},
) {
  return {
    ok,
    status,
    async json() {
      return structuredClone(body)
    },
  }
}

test(
  '004-E.1A acepta la respuesta completa del backend y entrega una copia',
  () => {
    const source = snapshot()
    const parsed =
      parseCharacterDraftApiSnapshotResponse(
        source,
      )

    source.identity.name = 'Mutado'

    assert.equal(
      parsed.identity.name,
      'Alicia',
    )
    assert.equal(parsed.revision, 1)
  },
)

test(
  '004-E.1A rechaza respuestas incompletas y disciplinas duplicadas',
  () => {
    assert.throws(
      () =>
        parseCharacterDraftApiSnapshotResponse({
          ...snapshot(),
          damage: undefined,
        }),
      (error) => {
        assert.ok(
          error instanceof
            CharacterDraftApiError,
        )
        assert.equal(error.status, 502)
        assert.equal(
          error.code,
          'INVALID_CHARACTER_DRAFT_RESPONSE',
        )
        return true
      },
    )

    assert.throws(
      () =>
        parseCharacterDraftApiSnapshotResponse({
          ...snapshot(),
          disciplines: [
            {
              disciplineKey: 'presence',
              rating: 2,
              powerKeys: ['a'],
              origin: 'creation',
            },
            {
              disciplineKey: 'presence',
              rating: 1,
              powerKeys: ['b'],
              origin: 'predatorType',
            },
          ],
        }),
      CharacterDraftApiError,
    )
  },
)

test(
  '004-E.1A crea un borrador usando sesión del navegador y el contrato POST',
  async () => {
    const calls = []
    const request = createRequest()
    const gateway =
      createCharacterDraftGateway(
        async (...args) => {
          calls.push(args)
          return jsonResponse(snapshot())
        },
      )

    const result =
      await gateway.create(request)

    assert.equal(result.characterId, characterId)
    assert.equal(calls.length, 1)
    assert.equal(
      calls[0][0],
      '/api/characters/drafts',
    )
    assert.equal(
      calls[0][1].method,
      'POST',
    )
    assert.equal(
      calls[0][1].credentials,
      'include',
    )
    assert.deepEqual(
      JSON.parse(calls[0][1].body),
      request,
    )
  },
)

test(
  '004-E.1A carga el borrador codificando su identidad en la ruta',
  async () => {
    const calls = []
    const gateway =
      createCharacterDraftGateway(
        async (...args) => {
          calls.push(args)
          return jsonResponse(snapshot())
        },
      )

    await gateway.load('id con espacio')

    assert.equal(
      calls[0][0],
      '/api/characters/drafts/id%20con%20espacio',
    )
    assert.equal(
      calls[0][1].credentials,
      'include',
    )
    assert.equal(
      calls[0][1].method,
      undefined,
    )
  },
)

test(
  '004-E.1A actualiza con PATCH y revisión optimista',
  async () => {
    const calls = []
    const gateway =
      createCharacterDraftGateway(
        async (...args) => {
          calls.push(args)
          return jsonResponse(
            snapshot({ revision: 3 }),
          )
        },
      )

    const result =
      await gateway.update(
        characterId,
        {
          expectedRevision: 2,
          identity: {
            concept: 'Investigadora',
          },
        },
      )

    assert.equal(result.revision, 3)
    assert.equal(
      calls[0][0],
      `/api/characters/drafts/${characterId}`,
    )
    assert.equal(
      calls[0][1].method,
      'PATCH',
    )
    assert.deepEqual(
      JSON.parse(calls[0][1].body),
      {
        expectedRevision: 2,
        identity: {
          concept: 'Investigadora',
        },
      },
    )
  },
)

test(
  '004-E.1A conserva estado código y violaciones de errores HTTP',
  async () => {
    const gateway =
      createCharacterDraftGateway(
        async () =>
          jsonResponse(
            {
              code:
                'CHARACTER_DRAFT_RULE_VIOLATION',
              violations: [
                'SKILL_DISTRIBUTION_INVALID',
              ],
            },
            {
              ok: false,
              status: 422,
            },
          ),
      )

    await assert.rejects(
      gateway.create(createRequest()),
      (error) => {
        assert.ok(
          error instanceof
            CharacterDraftApiError,
        )
        assert.equal(error.status, 422)
        assert.equal(
          error.code,
          'CHARACTER_DRAFT_RULE_VIOLATION',
        )
        assert.deepEqual(
          error.violations,
          [
            'SKILL_DISTRIBUTION_INVALID',
          ],
        )
        return true
      },
    )
  },
)


test(
  '004-E.1B.1 valida las elecciones persistidas del Tipo de Depredador',
  () => {
    const parsed =
      parseCharacterDraftApiSnapshotResponse({
        ...snapshot(),
        creation: {
          ...snapshot().creation,
          predatorTypeChoices: {
            'discipline-choice': 1,
          },
        },
      })

    assert.deepEqual(
      parsed.creation.predatorTypeChoices,
      {
        'discipline-choice': 1,
      },
    )

    assert.throws(
      () =>
        parseCharacterDraftApiSnapshotResponse({
          ...snapshot(),
          creation: {
            ...snapshot().creation,
            predatorTypeChoices: {
              'discipline-choice': -1,
            },
          },
        }),
      CharacterDraftApiError,
    )
  },
)
