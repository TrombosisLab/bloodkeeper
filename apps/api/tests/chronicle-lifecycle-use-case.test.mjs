import assert from 'node:assert/strict'
import test from 'node:test'

import {
  TransitionChronicleLifecycleUseCase,
} from '../dist/chronicles/application/transition-chronicle-lifecycle.use-case.js'

import {
  InvalidChronicleLifecycleTransitionError,
} from '../dist/chronicles/domain/chronicle-lifecycle.rules.js'

function chronicle(overrides = {}) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    narratorId: '22222222-2222-4222-8222-222222222222',
    name: 'Noches de A Coruña',
    description: null,
    status: 'preparation',
    createdAt: new Date('2026-08-09T18:00:00Z'),
    updatedAt: new Date('2026-08-09T18:00:00Z'),
    ...overrides,
  }
}

function setup(current = chronicle()) {
  const calls = []

  const repository = {
    async create() {
      throw new Error('not used')
    },
    async findByNarratorId() {
      throw new Error('not used')
    },
    async findById(narratorId, chronicleId) {
      calls.push([
        'findById',
        narratorId,
        chronicleId,
      ])

      return current
    },
    async transitionLifecycle(
      narratorId,
      data,
    ) {
      calls.push([
        'transitionLifecycle',
        narratorId,
        data,
      ])

      return {
        ...current,
        status: data.nextStatus,
      }
    },
  }

  return {
    calls,
    useCase:
      new TransitionChronicleLifecycleUseCase(
        repository,
      ),
  }
}

test(
  '030-C persiste preparación → activa mediante transición explícita',
  async () => {
    const { calls, useCase } =
      setup()

    const result =
      await useCase.execute(
        '22222222-2222-4222-8222-222222222222',
        '11111111-1111-4111-8111-111111111111',
        'active',
      )

    assert.equal(
      result?.status,
      'active',
    )
    assert.deepEqual(
      calls[1],
      [
        'transitionLifecycle',
        '22222222-2222-4222-8222-222222222222',
        {
          chronicleId:
            '11111111-1111-4111-8111-111111111111',
          expectedStatus:
            'preparation',
          nextStatus: 'active',
        },
      ],
    )
  },
)

test(
  '030-C archiva y reactiva usando las reglas de dominio existentes',
  async () => {
    const active =
      setup(
        chronicle({
          status: 'active',
        }),
      )

    assert.equal(
      (
        await active.useCase.execute(
          '22222222-2222-4222-8222-222222222222',
          '11111111-1111-4111-8111-111111111111',
          'archived',
        )
      )?.status,
      'archived',
    )

    const archived =
      setup(
        chronicle({
          status: 'archived',
        }),
      )

    assert.equal(
      (
        await archived.useCase.execute(
          '22222222-2222-4222-8222-222222222222',
          '11111111-1111-4111-8111-111111111111',
          'active',
        )
      )?.status,
      'active',
    )
  },
)

test(
  '030-C rechaza transición no declarada antes de escribir',
  async () => {
    const { calls, useCase } =
      setup()

    await assert.rejects(
      () =>
        useCase.execute(
          '22222222-2222-4222-8222-222222222222',
          '11111111-1111-4111-8111-111111111111',
          'archived',
        ),
      InvalidChronicleLifecycleTransitionError,
    )

    assert.equal(
      calls.some(
        ([name]) =>
          name ===
          'transitionLifecycle',
      ),
      false,
    )
  },
)

test(
  '030-C no expone una crónica ajena como transición autorizable',
  async () => {
    const { calls, useCase } =
      setup(null)

    assert.equal(
      await useCase.execute(
        '33333333-3333-4333-8333-333333333333',
        '11111111-1111-4111-8111-111111111111',
        'active',
      ),
      null,
    )

    assert.deepEqual(
      calls.map(([name]) => name),
      ['findById'],
    )
  },
)
