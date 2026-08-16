import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InitialVampireDisciplineInvalidError,
  ResolveInitialVampireStateUseCase,
} from '../dist/characters/application/resolve-initial-vampire-state.use-case.js'

import {
  characterRulesCatalog,
} from '../dist/characters/domain/character-rules-catalog.js'

const ownerId =
  '11111111-1111-4111-8111-111111111111'
const characterId =
  '22222222-2222-4222-8222-222222222222'

function character(overrides = {}) {
  return {
    characterId,
    ownerId,
    chronicleId: null,
    status: 'active',
    nature: 'vampire',
    revision: 3,
    identity: {
      clanKey: 'brujah',
      generation: 13,
      sire: null,
      predatorTypeKey: null,
    },
    creation: {
      creationMode: 'sessionZero',
    },
    blood: {
      bloodPotency: 1,
      hunger: 1,
    },
    disciplines: [],
    humanity: {
      value: 6,
      stains: 1,
    },
    ...overrides,
  }
}

function setup(initial = character()) {
  let current = initial

  const repository = {
    async findByCharacterId() {
      return current
    },
    async resolveInitialVampireState(data) {
      if (data.kind === 'discipline') {
        current = {
          ...current,
          revision: current.revision + 1,
          disciplines: [
            ...current.disciplines,
            {
              disciplineKey:
                data.disciplineKey,
              rating: data.rating,
              powerKeys: [],
              origin: 'creation',
            },
          ],
        }
      } else if (data.kind === 'power') {
        current = {
          ...current,
          revision: current.revision + 1,
          disciplines:
            current.disciplines.map(
              (discipline) =>
                discipline.disciplineKey ===
                  data.disciplineKey &&
                discipline.origin ===
                  'creation'
                  ? {
                      ...discipline,
                      powerKeys: [
                        ...discipline.powerKeys,
                        data.powerKey,
                      ],
                    }
                  : discipline,
            ),
        }
      }

      return current
    },
  }

  return new ResolveInitialVampireStateUseCase(
    repository,
    {
      async findActiveMembership() {
        throw new Error(
          'No membership without Chronicle',
        )
      },
    },
    characterRulesCatalog,
  )
}

test(
  '057-E2 manifiesta Disciplina con origen creation',
  async () => {
    const result =
      await setup().manifestDiscipline(
        ownerId,
        {
          characterId,
          expectedRevision: 3,
          disciplineKey: 'celerity',
          rating: 2,
        },
      )

    assert.equal(
      result.character.disciplines[0].origin,
      'creation',
    )
    assert.equal(
      result.pendingDecisions.includes(
        'initialDisciplines',
      ),
      true,
    )
  },
)

test(
  '057-E2 retira initialDisciplines sólo al completar 2+1',
  async () => {
    const result =
      await setup(
        character({
          disciplines: [
            {
              disciplineKey: 'celerity',
              rating: 2,
              powerKeys: [],
              origin: 'creation',
            },
          ],
        }),
      ).manifestDiscipline(
        ownerId,
        {
          characterId,
          expectedRevision: 3,
          disciplineKey: 'potence',
          rating: 1,
        },
      )

    assert.equal(
      result.pendingDecisions.includes(
        'initialDisciplines',
      ),
      false,
    )
    assert.equal(
      result.pendingDecisions.includes(
        'initialPowers',
      ),
      true,
    )
  },
)

test(
  '057-E2 rechaza Poder de nivel no cubierto',
  async () => {
    await assert.rejects(
      setup(
        character({
          disciplines: [
            {
              disciplineKey: 'potence',
              rating: 1,
              powerKeys: [],
              origin: 'creation',
            },
          ],
        }),
      ).manifestPower(
        ownerId,
        {
          characterId,
          expectedRevision: 3,
          disciplineKey: 'potence',
          powerKey: 'potence-prowess',
        },
      ),
      InitialVampireDisciplineInvalidError,
    )
  },
)
