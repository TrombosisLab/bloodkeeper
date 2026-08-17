import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InitialVampireDecisionAlreadyResolvedError,
  InitialVampireThinBloodInvalidError,
  ResolveInitialVampireStateUseCase,
} from '../dist/characters/application/resolve-initial-vampire-state.use-case.js'

import {
  characterRulesCatalog,
} from '../dist/characters/domain/character-rules-catalog.js'

import {
  CHARACTER_SKILL_KEYS,
} from '../dist/characters/domain/persisted-character.types.js'

const ownerId =
  '11111111-1111-4111-8111-111111111111'
const otherOwnerId =
  '99999999-9999-4999-8999-999999999999'
const characterId =
  '22222222-2222-4222-8222-222222222222'

function currentCharacter(
  overrides = {},
) {
  return {
    characterId,
    ownerId,
    chronicleId: null,
    status: 'active',
    nature: 'vampire',
    revision: 5,
    identity: {
      name: 'E3-C1',
      concept: 'Sangre Débil',
      predatorTypeKey: null,
      ambition: null,
      clanKey: 'thinBlood',
      sire: null,
      desire: null,
      generation: 14,
      ageCategory: 'neonate',
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
    blood: {
      bloodPotency: 0,
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
      CHARACTER_SKILL_KEYS.map(
        key => [key, 0],
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
    thinBloodAlchemy: null,
    thinBloodTraits: [],
    advantages: {
      selections: [],
    },
    humanity: {
      value: 6,
      stains: 1,
      convictions: [],
      touchstones: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function basicTraits() {
  return [
    {
      definitionKey: 'day-drinker',
      clanCurseDetails: null,
      disciplineAffinityDetails: null,
    },
    {
      definitionKey: 'baby-teeth',
      clanCurseDetails: null,
      disciplineAffinityDetails: null,
    },
  ]
}

function emptyAlchemy() {
  return {
    rating: 0,
    method: null,
    formulaKeys: [],
  }
}

function command(
  expectedRevision = 5,
) {
  return {
    characterId,
    expectedRevision,
    thinBloodTraits: basicTraits(),
    thinBloodAlchemy: emptyAlchemy(),
  }
}

function useCaseWithRepository(
  initial = currentCharacter(),
) {
  let current = initial
  let writes = 0
  let lastWrite = null

  const repository = {
    async findByCharacterId() {
      return current
    },

    async resolveInitialVampireState(data) {
      writes += 1
      lastWrite = data

      current = {
        ...current,
        revision: current.revision + 1,
        thinBloodTraits:
          data.thinBloodTraits,
        thinBloodAlchemy: {
          ...data.thinBloodAlchemy,
          formulaKeys: [
            ...data.thinBloodAlchemy
              .formulaKeys,
          ],
        },
        disciplines:
          data.discipline === null
            ? current.disciplines
            : [
                ...current.disciplines,
                {
                  disciplineKey:
                    data.discipline
                      .disciplineKey,
                  rating: 1,
                  powerKeys: [
                    data.discipline.powerKey,
                  ],
                  origin: 'thinBlood',
                },
              ],
      }

      return current
    },
  }

  const useCase =
    new ResolveInitialVampireStateUseCase(
      repository,
      {
        async findActiveMembership() {
          throw new Error('unused')
        },
      },
      characterRulesCatalog,
    )

  return {
    useCase,
    writes: () => writes,
    lastWrite: () => lastWrite,
  }
}

test(
  '057-E3C1 resuelve una sola vez y retira thinBloodState sin inventar Predator',
  async () => {
    const fixture =
      useCaseWithRepository()

    const result =
      await fixture.useCase
        .resolveThinBloodState(
          ownerId,
          command(),
        )

    assert.equal(
      fixture.writes(),
      1,
    )

    assert.equal(
      fixture.lastWrite().kind,
      'thinBloodState',
    )

    assert.equal(
      fixture.lastWrite().discipline,
      null,
    )

    assert.deepEqual(
      fixture.lastWrite().thinBloodAlchemy,
      emptyAlchemy(),
    )

    assert.equal(
      result.character.revision,
      6,
    )

    assert.equal(
      result.pendingDecisions.includes(
        'thinBloodState',
      ),
      false,
    )

    assert.equal(
      result.pendingDecisions.includes(
        'predatorType',
      ),
      false,
    )

    await assert.rejects(
      fixture.useCase.resolveThinBloodState(
        ownerId,
        command(6),
      ),
      InitialVampireDecisionAlreadyResolvedError,
    )

    assert.equal(
      fixture.writes(),
      1,
    )
  },
)

test(
  '057-E3C1 rechaza selección canónica inválida sin persistir',
  async () => {
    const fixture =
      useCaseWithRepository()

    await assert.rejects(
      fixture.useCase.resolveThinBloodState(
        ownerId,
        {
          ...command(),
          thinBloodTraits: [
            basicTraits()[0],
          ],
        },
      ),
      InitialVampireThinBloodInvalidError,
    )

    assert.equal(
      fixture.writes(),
      0,
    )
  },
)

test(
  '057-E3C1 sólo resuelve el perfil de un Sangre Débil',
  async () => {
    const fixture =
      useCaseWithRepository(
        currentCharacter({
          identity: {
            ...currentCharacter().identity,
            clanKey: 'brujah',
            generation: 13,
          },
          blood: {
            bloodPotency: 1,
            hunger: 1,
          },
        }),
      )

    await assert.rejects(
      fixture.useCase.resolveThinBloodState(
        ownerId,
        command(),
      ),
      InitialVampireThinBloodInvalidError,
    )

    assert.equal(
      fixture.writes(),
      0,
    )
  },
)

test(
  '057-E3C1 bloquea propietario ajeno y revisión obsoleta antes de escribir',
  async () => {
    const foreign =
      useCaseWithRepository()

    await assert.rejects(
      foreign.useCase.resolveThinBloodState(
        otherOwnerId,
        command(),
      ),
    )

    assert.equal(
      foreign.writes(),
      0,
    )

    const stale =
      useCaseWithRepository()

    await assert.rejects(
      stale.useCase.resolveThinBloodState(
        ownerId,
        command(4),
      ),
    )

    assert.equal(
      stale.writes(),
      0,
    )
  },
)
