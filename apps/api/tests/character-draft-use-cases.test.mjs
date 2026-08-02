import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CreateCharacterDraftUseCase,
} from '../dist/characters/application/create-character-draft.use-case.js'

import {
  LoadCharacterDraftUseCase,
} from '../dist/characters/application/load-character-draft.use-case.js'

import {
  UpdateCharacterDraftUseCase,
} from '../dist/characters/application/update-character-draft.use-case.js'

import {
  CHARACTER_SKILL_KEYS,
} from '../dist/characters/domain/persisted-character.types.js'

function createEmptySkills() {
  return Object.fromEntries(
    CHARACTER_SKILL_KEYS.map(
      (skillKey) => [skillKey, 0],
    ),
  )
}

function createBalancedSkills() {
  const ratings = [
    ...Array(7).fill(1),
    ...Array(5).fill(2),
    ...Array(3).fill(3),
  ]

  return Object.fromEntries(
    CHARACTER_SKILL_KEYS.map(
      (skillKey, index) => [
        skillKey,
        ratings[index] ?? 0,
      ],
    ),
  )
}

function createValidAttributes() {
  return {
    strength: 4,
    dexterity: 3,
    stamina: 3,
    charisma: 3,
    manipulation: 2,
    composure: 2,
    intelligence: 2,
    wits: 2,
    resolve: 1,
  }
}

function createInitialAttributes() {
  return Object.fromEntries(
    Object.keys(createValidAttributes()).map(
      (attributeKey) => [attributeKey, 1],
    ),
  )
}

function createRepository() {
  const calls = []
  const record = {
    characterId:
      '39c1801e-68fe-4c92-8795-723cac284bdf',
    revision: 1,
    attributes: createValidAttributes(),
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
    skills: createBalancedSkills(),
    skillSpecialties: [],
    creation: {
      currentStep: 'blood',
      skillDistributionMethod: 'balanced',
    },
  }

  return {
    calls,
    record,
    async create(data) {
      calls.push(['create', data])
      return record
    },
    async findById(ownerId, characterId) {
      calls.push(['findById', ownerId, characterId])
      return characterId === record.characterId
        ? record
        : null
    },
    async update(ownerId, data) {
      calls.push(['update', ownerId, data])
      return {
        ...record,
        revision: data.expectedRevision + 1,
      }
    },
  }
}

test(
  '004-C crea borradores mediante el repositorio',
  async () => {
    const repository = createRepository()
    const useCase =
      new CreateCharacterDraftUseCase(
        repository,
      )
    const command = {
      ownerId:
        '3bbc46f8-a45f-4589-9872-129e6652082c',
      chronicleId: null,
      identity: { name: 'Alicia' },
      attributes: createInitialAttributes(),
      blood: {
        bloodPotency: 1,
        hunger: 1,
      },
      skills: createEmptySkills(),
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
        convictions: [],
        touchstones: [],
      },
      creation: {
        currentStep: 'identity',
        skillDistributionMethod: 'balanced',
      },
    }

    const result = await useCase.execute(command)

    assert.equal(result, repository.record)
    assert.deepEqual(
      repository.calls,
      [['create', command]],
    )

    assert.throws(
      () =>
        useCase.execute({
          ...command,
          attributes: {
            ...command.attributes,
            resolve: 5,
          },
        }),
      {
        name:
          'InvalidCharacterAttributeSkillStateError',
      },
    )

    assert.deepEqual(
      repository.calls,
      [['create', command]],
    )
  },
)

test(
  '005-A valida el estado combinado antes de actualizar',
  async () => {
    const repository = createRepository()
    const useCase =
      new UpdateCharacterDraftUseCase(
        repository,
      )
    const ownerId =
      '3bbc46f8-a45f-4589-9872-129e6652082c'
    const command = {
      characterId: repository.record.characterId,
      expectedRevision: 1,
      skills: { athletics: 0 },
    }

    await assert.rejects(
      useCase.execute(ownerId, command),
      {
        name:
          'InvalidCharacterAttributeSkillStateError',
      },
    )

    assert.deepEqual(repository.calls, [
      [
        'findById',
        ownerId,
        repository.record.characterId,
      ],
    ])
  },
)

test(
  '004-D.2 carga un borrador en el contexto de su propietario',
  async () => {
    const repository = createRepository()
    const useCase =
      new LoadCharacterDraftUseCase(repository)
    const ownerId =
      '3bbc46f8-a45f-4589-9872-129e6652082c'

    assert.equal(
      await useCase.execute(
        ownerId,
        repository.record.characterId,
      ),
      repository.record,
    )
    assert.equal(
      await useCase.execute(ownerId, 'missing'),
      null,
    )
    assert.deepEqual(repository.calls, [
      [
        'findById',
        ownerId,
        repository.record.characterId,
      ],
      ['findById', ownerId, 'missing'],
    ])
  },
)

test(
  '006-C valida daño contra los máximos derivados',
  async () => {
    const repository = createRepository()
    const useCase =
      new UpdateCharacterDraftUseCase(
        repository,
      )
    const ownerId =
      '3bbc46f8-a45f-4589-9872-129e6652082c'

    await assert.rejects(
      useCase.execute(ownerId, {
        characterId: repository.record.characterId,
        expectedRevision: 1,
        damage: {
          health: {
            superficial: 7,
            aggravated: 0,
          },
          willpower: {
            superficial: 0,
            aggravated: 0,
          },
        },
      }),
      {
        name: 'InvalidCharacterDamageStateError',
      },
    )

    repository.record.damage.health.superficial = 5

    await assert.rejects(
      useCase.execute(ownerId, {
        characterId: repository.record.characterId,
        expectedRevision: 1,
        attributes: {
          stamina: 1,
          resolve: 3,
        },
      }),
      {
        name: 'InvalidCharacterDamageStateError',
      },
    )
  },
)

test(
  '004-D.2 actualiza con propietario y revisión optimista',
  async () => {
    const repository = createRepository()
    const useCase =
      new UpdateCharacterDraftUseCase(
        repository,
      )
    const command = {
      characterId: repository.record.characterId,
      expectedRevision: 4,
      identity: { concept: 'Investigadora' },
    }
    const ownerId =
      '3bbc46f8-a45f-4589-9872-129e6652082c'

    const result = await useCase.execute(
      ownerId,
      command,
    )

    assert.equal(result.revision, 5)
    assert.deepEqual(
      repository.calls,
      [['update', ownerId, command]],
    )
  },
)
