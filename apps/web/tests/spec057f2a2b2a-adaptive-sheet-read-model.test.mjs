import assert from 'node:assert/strict'
import test from 'node:test'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  adaptPersistedCharacterToSheetModel,
} from '../src/features/character-sheet/domain/persisted-character-sheet.adapter.ts'

import {
  loadPersistedCharacterSheet,
} from '../src/features/character-sheet/domain/persisted-character-sheet.loader.ts'

import {
  parseCharacterStateResponse,
} from '../src/features/character-sheet/infrastructure/character-state.api.ts'

const characterId =
  '11111111-1111-4111-8111-111111111111'

function snapshot({
  nature = 'human',
  creationMode = 'sessionZero',
  blood = null,
} = {}) {
  return {
    characterId,
    ownerId:
      '22222222-2222-4222-8222-222222222222',
    chronicleId: null,
    status: 'active',
    nature,
    revision: 8,
    createdAt:
      '2026-08-17T10:00:00.000Z',
    updatedAt:
      '2026-08-17T11:00:00.000Z',
    identity: {
      name: 'Alicia',
      concept: 'Investigadora',
      predatorTypeKey: null,
      ambition: 'Proteger a su familia',
      clanKey: null,
      sire: null,
      desire: 'Conocer la verdad',
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
        superficial: 1,
        aggravated: 0,
      },
      willpower: {
        superficial: 0,
        aggravated: 1,
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
    thinBloodAlchemy: null,
    thinBloodTraits: [],
    advantages: {
      selections: [],
    },
    humanity: {
      value: 7,
      stains: 1,
      convictions: [],
      touchstones: [],
    },
  }
}

test(
  '057-F2A2B2A proyecta HUMAN sin Hambre ni Potencia ficticias',
  () => {
    const model =
      adaptPersistedCharacterToSheetModel(
        snapshot(),
        'HUMAN',
      )

    assert.equal(
      model.nature,
      'human',
    )
    assert.equal(
      model.profilePhase,
      'HUMAN',
    )
    assert.deepEqual(
      model.state,
      {
        humanity: {
          value: 7,
          stains: 1,
        },
        hunger: null,
        bloodPotency: null,
      },
    )
  },
)

test(
  '057-F2A2B2A proyecta transición sin exigir Blood',
  () => {
    const model =
      adaptPersistedCharacterToSheetModel(
        snapshot({
          nature: 'vampire',
        }),
        'TRANSITIONAL_VAMPIRE',
      )

    assert.equal(
      model.nature,
      'vampire',
    )
    assert.equal(
      model.profilePhase,
      'TRANSITIONAL_VAMPIRE',
    )
    assert.equal(
      model.state.hunger,
      null,
    )
    assert.equal(
      model.state.bloodPotency,
      null,
    )
  },
)

test(
  '057-F2A2B2A conserva estado vampírico establecido',
  () => {
    const model =
      adaptPersistedCharacterToSheetModel(
        snapshot({
          nature: 'vampire',
          creationMode: 'standard',
          blood: {
            hunger: 3,
            bloodPotency: 2,
          },
        }),
        'ESTABLISHED_VAMPIRE',
      )

    assert.equal(
      model.state.hunger,
      3,
    )
    assert.equal(
      model.state.bloodPotency,
      2,
    )
  },
)

test(
  '057-F2A2B2A acepta respuesta operativa con Hambre ausente',
  () => {
    const parsed =
      parseCharacterStateResponse({
        characterId,
        revision: 9,
        status: 'active',
        hunger: null,
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
        humanity: {
          value: 7,
          stains: 0,
        },
      })

    assert.equal(
      parsed.hunger,
      null,
    )
  },
)

test(
  '057-F2A2B2A loader combina draft y fase backend sin derivarla',
  async () => {
    const source =
      snapshot()

    let draftLoads = 0
    let phaseLoads = 0

    const gateway = {
      async create() {
        throw new Error('unexpected')
      },

      async load(receivedCharacterId) {
        draftLoads += 1
        assert.equal(
          receivedCharacterId,
          characterId,
        )
        return source
      },

      async update() {
        throw new Error('unexpected')
      },
    }

    const profilePhaseGateway = {
      async load(receivedCharacterId) {
        phaseLoads += 1
        assert.equal(
          receivedCharacterId,
          characterId,
        )
        return {
          phase: 'HUMAN',
        }
      },
    }

    const model =
      await loadPersistedCharacterSheet(
        gateway,
        profilePhaseGateway,
        characterId,
      )

    assert.equal(draftLoads, 1)
    assert.equal(phaseLoads, 1)
    assert.equal(
      model.profilePhase,
      'HUMAN',
    )
  },
)
