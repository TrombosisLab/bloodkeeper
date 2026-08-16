import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CharacterEmbraceWriteConflictError,
} from '../dist/characters/application/character-draft.repository.js'

import {
  CharacterAlreadyEmbracedError,
  CharacterEmbraceArchivedError,
  CharacterEmbraceCreationModeError,
  CharacterEmbraceHumanProfileIncompleteError,
  CharacterEmbracePermissionError,
  EmbraceCharacterUseCase,
} from '../dist/characters/application/embrace-character.use-case.js'

const actorId =
  '95d36262-e901-468d-90a1-235680e68160'
const otherId =
  '3ba2543e-e0cf-42a3-aa82-920358320412'
const characterId =
  '1c064c4c-dc64-458e-b7a4-c6384b9d7d26'
const chronicleId =
  '517fdf83-a2f5-4db3-8ae4-9b4a33dfef59'

function character(overrides = {}) {
  return {
    characterId,
    ownerId: actorId,
    chronicleId: null,
    status: 'active',
    nature: 'human',
    revision: 4,
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
    disciplines: [],
    advantages: {
      selections: [],
    },
    humanity: {
      value: 5,
      stains: 1,
    },
    ...overrides,
  }
}

function validation(
  canProceed = true,
  context = 'play',
) {
  return {
    context,
    canProceed,
    sections: [],
    issues: canProceed
      ? []
      : [
          {
            code: 'PROFILE_INCOMPLETE',
            severity: 'error',
            section: 'identity',
            field: null,
            message: 'incomplete',
          },
        ],
  }
}

function setup({
  current = character(),
  membership = null,
  canProceed = true,
} = {}) {
  const calls = []
  const characters = {
    async findByCharacterId(id) {
      calls.push(['find', id])
      return current
    },
    async embrace(data) {
      calls.push(['embrace', data])
      return {
        ...current,
        nature: 'vampire',
        revision:
          current.revision + 1,
      }
    },
  }
  const participants = {
    async findActiveMembership(
      requestedChronicleId,
      userId,
    ) {
      calls.push([
        'membership',
        requestedChronicleId,
        userId,
      ])
      return membership
    },
  }
  const validator = {
    validate(value, context) {
      calls.push([
        'validate',
        value.characterId,
        context,
      ])
      return validation(
        canProceed,
        context,
      )
    },
  }

  return {
    calls,
    useCase:
      new EmbraceCharacterUseCase(
        characters,
        participants,
        validator,
      ),
  }
}

test(
  '057-D permite al propietario abrazar su personaje sin Crónica',
  async () => {
    const { calls, useCase } = setup()

    const result =
      await useCase.execute(
        actorId,
        {
          characterId,
          expectedRevision: 4,
        },
      )

    assert.equal(
      result.character.nature,
      'vampire',
    )
    assert.equal(
      result.character.humanity.value,
      5,
    )
    assert.equal(
      result.character.revision,
      5,
    )
    assert.deepEqual(
      result.pendingDecisions,
      [
        'clan',
        'generation',
        'sire',
        'bloodState',
        'predatorType',
        'initialDisciplines',
        'initialPowers',
        'advantagesReview',
      ],
    )
    assert.equal(
      calls.some(
        ([kind]) =>
          kind === 'membership',
      ),
      false,
    )
  },
)

test(
  '057-D exige Narrador contextual dentro de Crónica incluso al propietario',
  async () => {
    const denied = setup({
      current: character({
        chronicleId,
      }),
      membership: {
        role: 'player',
        status: 'active',
      },
    })

    await assert.rejects(
      denied.useCase.execute(
        actorId,
        {
          characterId,
          expectedRevision: 4,
        },
      ),
      CharacterEmbracePermissionError,
    )

    const allowed = setup({
      current: character({
        ownerId: otherId,
        chronicleId,
      }),
      membership: {
        role: 'narrator',
        status: 'active',
      },
    })

    const result =
      await allowed.useCase.execute(
        actorId,
        {
          characterId,
          expectedRevision: 4,
        },
      )

    assert.equal(
      result.character.nature,
      'vampire',
    )
  },
)

test(
  '057-D rechaza archivado segundo Abrazo modo incompatible y revisión obsoleta',
  async () => {
    await assert.rejects(
      setup({
        current: character({
          status: 'archived',
        }),
      }).useCase.execute(
        actorId,
        {
          characterId,
          expectedRevision: 4,
        },
      ),
      CharacterEmbraceArchivedError,
    )

    await assert.rejects(
      setup({
        current: character({
          nature: 'vampire',
        }),
      }).useCase.execute(
        actorId,
        {
          characterId,
          expectedRevision: 4,
        },
      ),
      CharacterAlreadyEmbracedError,
    )

    await assert.rejects(
      setup({
        current: character({
          creation: {
            creationMode: 'standard',
          },
        }),
      }).useCase.execute(
        actorId,
        {
          characterId,
          expectedRevision: 4,
        },
      ),
      CharacterEmbraceCreationModeError,
    )

    await assert.rejects(
      setup().useCase.execute(
        actorId,
        {
          characterId,
          expectedRevision: 3,
        },
      ),
      CharacterEmbraceWriteConflictError,
    )
  },
)

test(
  '057-D exige perfil humano coherente y usa activation para DRAFT',
  async () => {
    const incomplete = setup({
      current: character({
        status: 'draft',
      }),
      canProceed: false,
    })

    await assert.rejects(
      incomplete.useCase.execute(
        actorId,
        {
          characterId,
          expectedRevision: 4,
        },
      ),
      CharacterEmbraceHumanProfileIncompleteError,
    )

    assert.deepEqual(
      incomplete.calls.find(
        ([kind]) =>
          kind === 'validate',
      ),
      [
        'validate',
        characterId,
        'activation',
      ],
    )
  },
)
