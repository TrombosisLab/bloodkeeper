import assert from 'node:assert/strict'
import test from 'node:test'
import 'reflect-metadata'

import {
  RequestMethod,
} from '@nestjs/common'

import {
  ChronicleController,
} from '../dist/chronicles/presentation/chronicle.controller.js'

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

function controller(overrides = {}) {
  const calls = []
  const createChronicle = {
    async execute(command) {
      calls.push(['create', command])
      return chronicle()
    },
  }
  const listChronicles = {
    async execute(id) {
      calls.push(['list', id])
      return [chronicle()]
    },
  }

  return {
    calls,
    instance: new ChronicleController(
      overrides.createChronicle ??
        createChronicle,
      overrides.listChronicles ??
        listChronicles,
    ),
  }
}

function authenticatedRequest() {
  return {
    user: {
      id: narratorId,
      roles: ['narrator'],
    },
  }
}

function hasStatus(status) {
  return (error) => {
    assert.equal(
      error.getStatus(),
      status,
    )
    return true
  }
}

test(
  '030-B publica POST y GET sobre /chronicles',
  () => {
    assert.equal(
      Reflect.getMetadata(
        'path',
        ChronicleController,
      ),
      'chronicles',
    )

    for (
      const [
        method,
        requestMethod,
      ] of [
        ['create', RequestMethod.POST],
        ['list', RequestMethod.GET],
      ]
    ) {
      const handler =
        ChronicleController.prototype[
          method
        ]

      assert.equal(
        Reflect.getMetadata(
          'path',
          handler,
        ),
        '/',
      )
      assert.equal(
        Reflect.getMetadata(
          'method',
          handler,
        ),
        requestMethod,
      )
    }
  },
)

test(
  '030-B exige autenticación para crear y listar',
  async () => {
    const { instance, calls } =
      controller()

    await assert.rejects(
      instance.list({}),
      hasStatus(401),
    )
    await assert.rejects(
      instance.create(
        {
          user: {
            id: 'invalid',
          },
        },
        {
          name: 'Crónica',
        },
      ),
      hasStatus(401),
    )

    assert.deepEqual(calls, [])
  },
)

test(
  '030-B permite listar al jugador pero mantiene la creacion reservada',
  async () => {
    const { instance, calls } =
      controller()
    const request = {
      user: {
        id: narratorId,
        roles: ['player'],
      },
    }

    const listed =
      await instance.list(request)

    await assert.rejects(
      instance.create(
        request,
        { name: 'Cronica' },
      ),
      hasStatus(403),
    )

    assert.equal(listed.length, 1)
    assert.deepEqual(calls, [
      ['list', narratorId],
    ])
  },
)

test(
  '030-B crea y lista para el narrador autenticado',
  async () => {
    const { instance, calls } =
      controller()

    const created =
      await instance.create(
        authenticatedRequest(),
        {
          name: 'Noches de A Coruña',
        },
      )
    const listed =
      await instance.list(
        authenticatedRequest(),
      )

    assert.equal(
      created.createdAt,
      '2026-08-04T17:30:00.000Z',
    )
    assert.equal(listed.length, 1)
    assert.deepEqual(calls, [
      [
        'create',
        {
          narratorId,
          name: 'Noches de A Coruña',
          description: null,
        },
      ],
      ['list', narratorId],
    ])
  },
)

test(
  '030-B traduce entradas inválidas a 400',
  async () => {
    const { instance, calls } =
      controller()

    await assert.rejects(
      instance.create(
        authenticatedRequest(),
        {},
      ),
      hasStatus(400),
    )

    assert.deepEqual(calls, [])
  },
)
