import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CharacterInitialVampireResolutionWriteConflictError,
} from '../dist/characters/application/character-draft.repository.js'

import {
  InitialVampireDecisionAlreadyResolvedError,
  InitialVampirePrerequisitePendingError,
  InitialVampireResolutionPermissionError,
  InitialVampireSelectionInvalidError,
  ResolveInitialVampireStateUseCase,
} from '../dist/characters/application/resolve-initial-vampire-state.use-case.js'

import {
  characterRulesCatalog,
} from '../dist/characters/domain/character-rules-catalog.js'

const ownerId =
  '11111111-1111-4111-8111-111111111111'
const narratorId =
  '22222222-2222-4222-8222-222222222222'
const characterId =
  '33333333-3333-4333-8333-333333333333'
const chronicleId =
  '44444444-4444-4444-8444-444444444444'

function character(overrides = {}) {
  return {
    characterId,
    ownerId,
    chronicleId: null,
    status: 'active',
    nature: 'vampire',
    revision: 2,
    identity: {
      clanKey: null,
      generation: null,
      sire: null,
      predatorTypeKey: null,
    },
    creation: {
      creationMode: 'sessionZero',
    },
    blood: null,
    thinBloodAlchemy: null,
    disciplines: [],
    advantages: {
      selections: [],
    },
    humanity: {
      value: 6,
      stains: 1,
    },
    ...overrides,
  }
}

function setup({
  current = character(),
  membership = null,
} = {}) {
  let value = current

  const repository = {
    async findByCharacterId() {
      return value
    },
    async resolveInitialVampireState(data) {
      if (data.kind === 'clan') {
        value = {
          ...value,
          revision: value.revision + 1,
          identity: {
            ...value.identity,
            clanKey: data.clanKey,
          },
        }
      } else if (
        data.kind === 'generation'
      ) {
        value = {
          ...value,
          revision: value.revision + 1,
          identity: {
            ...value.identity,
            generation: data.generation,
          },
        }
      } else {
        value = {
          ...value,
          revision: value.revision + 1,
          blood: data.blood,
        }
      }

      return value
    },
  }

  const participants = {
    async findActiveMembership() {
      return membership
    },
  }

  return new ResolveInitialVampireStateUseCase(
    repository,
    participants,
    characterRulesCatalog,
  )
}

test(
  '057-E1 resuelve Clan y conserva Humanidad',
  async () => {
    const useCase = setup()

    const result =
      await useCase.resolveClan(
        ownerId,
        {
          characterId,
          expectedRevision: 2,
          clanKey: 'brujah',
        },
      )

    assert.equal(
      result.character.identity.clanKey,
      'brujah',
    )
    assert.deepEqual(
      result.character.humanity,
      {
        value: 6,
        stains: 1,
      },
    )
    assert.equal(
      result.pendingDecisions.includes(
        'clan',
      ),
      false,
    )
  },
)

test(
  '057-E1 Sangre requiere Generación y no inventa defaults',
  async () => {
    await assert.rejects(
      setup().establishBlood(
        ownerId,
        {
          characterId,
          expectedRevision: 2,
          bloodPotency: 1,
          hunger: 1,
        },
      ),
      InitialVampirePrerequisitePendingError,
    )
  },
)

test(
  '057-E1 respeta restricciones de Sangre Débil',
  async () => {
    await assert.rejects(
      setup({
        current: character({
          identity: {
            ...character().identity,
            clanKey: 'thinBlood',
          },
        }),
      }).resolveGeneration(
        ownerId,
        {
          characterId,
          expectedRevision: 2,
          generation: 13,
        },
      ),
      InitialVampireSelectionInvalidError,
    )

    await assert.rejects(
      setup({
        current: character({
          identity: {
            ...character().identity,
            clanKey: 'thinBlood',
            generation: 14,
          },
        }),
      }).establishBlood(
        ownerId,
        {
          characterId,
          expectedRevision: 2,
          bloodPotency: 1,
          hunger: 2,
        },
      ),
      InitialVampireSelectionInvalidError,
    )
  },
)

test(
  '057-E1 exige Narrador contextual dentro de Crónica',
  async () => {
    await assert.rejects(
      setup({
        current: character({
          chronicleId,
        }),
        membership: {
          role: 'player',
          status: 'active',
        },
      }).resolveClan(
        ownerId,
        {
          characterId,
          expectedRevision: 2,
          clanKey: 'brujah',
        },
      ),
      InitialVampireResolutionPermissionError,
    )

    const allowed = setup({
      current: character({
        chronicleId,
      }),
      membership: {
        role: 'narrator',
        status: 'active',
      },
    })

    const result =
      await allowed.resolveClan(
        narratorId,
        {
          characterId,
          expectedRevision: 2,
          clanKey: 'brujah',
        },
      )

    assert.equal(
      result.character.identity.clanKey,
      'brujah',
    )
  },
)

test(
  '057-E1 rechaza revisión obsoleta y decisión repetida',
  async () => {
    await assert.rejects(
      setup().resolveClan(
        ownerId,
        {
          characterId,
          expectedRevision: 1,
          clanKey: 'brujah',
        },
      ),
      CharacterInitialVampireResolutionWriteConflictError,
    )

    await assert.rejects(
      setup({
        current: character({
          identity: {
            ...character().identity,
            clanKey: 'brujah',
          },
        }),
      }).resolveClan(
        ownerId,
        {
          characterId,
          expectedRevision: 2,
          clanKey: 'gangrel',
        },
      ),
      InitialVampireDecisionAlreadyResolvedError,
    )
  },
)
