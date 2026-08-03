import assert from 'node:assert/strict'
import test from 'node:test'

import {
  LoadCharacterSecondaryUseCase,
} from '../dist/characters/application/load-character-secondary.use-case.js'

import {
  UpdateCharacterSecondaryUseCase,
} from '../dist/characters/application/update-character-secondary.use-case.js'

const ownerId =
  '3bbc46f8-a45f-4589-9872-129e6652082c'
const characterId =
  '39c1801e-68fe-4c92-8795-723cac284bdf'

function secondary() {
  return {
    characterId,
    revision: 2,
    inventory: [],
    notes: [],
    history: [],
  }
}

test(
  '028-E carga datos secundarios con propietario y personaje',
  async () => {
    const calls = []
    const repository = {
      async findByCharacterId(owner, id) {
        calls.push([owner, id])
        return secondary()
      },
    }
    const useCase =
      new LoadCharacterSecondaryUseCase(
        repository,
      )

    assert.deepEqual(
      await useCase.execute(ownerId, characterId),
      secondary(),
    )
    assert.deepEqual(calls, [
      [ownerId, characterId],
    ])
  },
)

test(
  '028-E valida y envia una unica seccion al repositorio',
  async () => {
    const calls = []
    const repository = {
      async update(owner, command) {
        calls.push([owner, command])
        return secondary()
      },
    }
    const useCase =
      new UpdateCharacterSecondaryUseCase(
        repository,
      )
    const command = {
      characterId,
      expectedRevision: 1,
      section: 'notes',
      notes: [],
    }

    await useCase.execute(ownerId, command)

    assert.deepEqual(calls, [
      [ownerId, command],
    ])
  },
)

test(
  '028-E no consulta persistencia si el dominio es invalido',
  async () => {
    let writes = 0
    const useCase =
      new UpdateCharacterSecondaryUseCase({
        async update() {
          writes += 1
          return secondary()
        },
      })

    assert.throws(
      () =>
        useCase.execute(ownerId, {
          characterId,
          expectedRevision: 1,
          section: 'history',
          history: [
            {
              id: characterId,
              title: '',
              description: '',
            },
          ],
        }),
      /Character secondary data is invalid/,
    )
    assert.equal(writes, 0)
  },
)
