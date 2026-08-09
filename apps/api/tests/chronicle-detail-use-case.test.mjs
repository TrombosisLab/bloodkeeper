import assert from 'node:assert/strict'
import test from 'node:test'

import {
  LoadChronicleUseCase,
} from '../dist/chronicles/application/load-chronicle.use-case.js'

const narratorId =
  '22222222-2222-4222-8222-222222222222'
const chronicleId =
  '11111111-1111-4111-8111-111111111111'

test(
  '030-D carga una crónica concreta mediante el repositorio autorizado',
  async () => {
    const calls = []
    const expected = {
      id: chronicleId,
      narratorId,
      name: 'Noches de A Coruña',
      description: 'Premisa',
      status: 'active',
      createdAt:
        new Date('2026-08-09T18:00:00Z'),
      updatedAt:
        new Date('2026-08-09T19:00:00Z'),
    }

    const repository = {
      async create() {
        throw new Error('not used')
      },
      async findByNarratorId() {
        throw new Error('not used')
      },
      async findById(
        owner,
        id,
      ) {
        calls.push([
          owner,
          id,
        ])
        return expected
      },
      async transitionLifecycle() {
        throw new Error('not used')
      },
    }

    const useCase =
      new LoadChronicleUseCase(
        repository,
      )

    assert.equal(
      await useCase.execute(
        narratorId,
        chronicleId,
      ),
      expected,
    )
    assert.deepEqual(
      calls,
      [[narratorId, chronicleId]],
    )
  },
)

test(
  '030-D conserva null cuando la crónica no pertenece al narrador',
  async () => {
    const repository = {
      async create() {
        throw new Error('not used')
      },
      async findByNarratorId() {
        throw new Error('not used')
      },
      async findById() {
        return null
      },
      async transitionLifecycle() {
        throw new Error('not used')
      },
    }

    const useCase =
      new LoadChronicleUseCase(
        repository,
      )

    assert.equal(
      await useCase.execute(
        narratorId,
        chronicleId,
      ),
      null,
    )
  },
)
