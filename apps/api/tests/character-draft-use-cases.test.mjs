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

function createRepository() {
  const calls = []
  const record = {
    characterId:
      '39c1801e-68fe-4c92-8795-723cac284bdf',
    revision: 1,
  }

  return {
    calls,
    record,
    async create(data) {
      calls.push(['create', data])
      return record
    },
    async findById(characterId) {
      calls.push(['findById', characterId])
      return characterId === record.characterId
        ? record
        : null
    },
    async update(data) {
      calls.push(['update', data])
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
  },
)

test(
  '004-C carga un borrador por su identidad estable',
  async () => {
    const repository = createRepository()
    const useCase =
      new LoadCharacterDraftUseCase(repository)

    assert.equal(
      await useCase.execute(
        repository.record.characterId,
      ),
      repository.record,
    )
    assert.equal(
      await useCase.execute('missing'),
      null,
    )
  },
)

test(
  '004-C actualiza mediante revisión optimista',
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

    const result = await useCase.execute(command)

    assert.equal(result.revision, 5)
    assert.deepEqual(
      repository.calls,
      [['update', command]],
    )
  },
)
