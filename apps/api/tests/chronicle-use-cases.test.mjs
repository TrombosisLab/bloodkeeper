import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CreateChronicleUseCase,
} from '../dist/chronicles/application/create-chronicle.use-case.js'

import {
  ListChroniclesUseCase,
} from '../dist/chronicles/application/list-chronicles.use-case.js'

const narratorId =
  '3bbc46f8-a45f-4589-9872-129e6652082c'

function chronicle() {
  const now =
    new Date('2026-08-04T17:30:00.000Z')

  return {
    id:
      '39c1801e-68fe-4c92-8795-723cac284bdf',
    narratorId,
    name: 'Noches de A Coruña',
    description: null,
    status: 'preparation',
    createdAt: now,
    updatedAt: now,
  }
}

test(
  '030-B crea mediante el repositorio con datos normalizados',
  async () => {
    const calls = []
    const expected = chronicle()
    const repository = {
      async create(data) {
        calls.push(['create', data])
        return expected
      },
      async findByNarratorId() {
        return []
      },
    }

    const useCase =
      new CreateChronicleUseCase(
        repository,
      )

    assert.equal(
      await useCase.execute({
        narratorId,
        name: '  Noches de A Coruña ',
        description: '   ',
      }),
      expected,
    )

    assert.deepEqual(calls, [
      [
        'create',
        {
          narratorId,
          name: 'Noches de A Coruña',
          description: null,
        },
      ],
    ])
  },
)

test(
  '030-B lista únicamente mediante el narrador autenticado',
  async () => {
    const calls = []
    const expected = [chronicle()]
    const repository = {
      async create() {
        throw new Error('unexpected')
      },
      async findByNarratorId(id) {
        calls.push([
          'findByNarratorId',
          id,
        ])
        return expected
      },
    }

    const useCase =
      new ListChroniclesUseCase(
        repository,
      )

    assert.equal(
      await useCase.execute(narratorId),
      expected,
    )
    assert.deepEqual(calls, [
      [
        'findByNarratorId',
        narratorId,
      ],
    ])
  },
)
