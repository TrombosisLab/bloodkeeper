import assert from 'node:assert/strict'
import test from 'node:test'

import {
  LoadCharacterHungerUseCase,
} from '../dist/characters/application/load-character-hunger.use-case.js'

import {
  toCharacterHungerReadModel,
} from '../dist/characters/domain/character-hunger-read-model.js'

const ownerId =
  '3bbc46f8-a45f-4589-9872-129e6652082c'
const characterId =
  '39c1801e-68fe-4c92-8795-723cac284bdf'

function repository() {
  const calls = []
  const draft = {
    characterId,
    revision: 7,
    blood: {
      bloodPotency: 2,
      hunger: 3,
    },
    identity: {
      name: 'No debe exponerse',
    },
  }

  return {
    calls,
    draft,
    async findById(owner, id) {
      calls.push(['findById', owner, id])

      return owner === ownerId &&
        id === characterId
        ? draft
        : null
    },
  }
}

test(
  '027-D entrega al módulo de dados únicamente el Hambre autorizado',
  async () => {
    const source = repository()
    const useCase =
      new LoadCharacterHungerUseCase(
        source,
      )

    const state = await useCase.execute(
      ownerId,
      characterId,
    )

    assert.deepEqual(state, {
      characterId,
      revision: 7,
      hunger: 3,
    })
    assert.deepEqual(source.calls, [
      ['findById', ownerId, characterId],
    ])
  },
)

test(
  '027-D mantiene la lectura aislada de cualquier modificación',
  async () => {
    const source = repository()
    const useCase =
      new LoadCharacterHungerUseCase(
        source,
      )
    const state = await useCase.execute(
      ownerId,
      characterId,
    )

    assert.throws(
      () => {
        state.hunger = 5
      },
      TypeError,
    )
    assert.equal(source.draft.blood.hunger, 3)
  },
)

test(
  '027-D no revela el Hambre de personajes ajenos o ausentes',
  async () => {
    const source = repository()
    const useCase =
      new LoadCharacterHungerUseCase(
        source,
      )

    assert.equal(
      await useCase.execute(
        '22222222-2222-4222-8222-222222222222',
        characterId,
      ),
      null,
    )
  },
)

test(
  '027-D rechaza proyectar Hambre persistida fuera del dominio',
  () => {
    assert.throws(
      () =>
        toCharacterHungerReadModel({
          characterId,
          revision: 7,
          blood: {
            bloodPotency: 2,
            hunger: 6,
          },
        }),
      {
        name:
          'InvalidCharacterHungerError',
      },
    )
  },
)
