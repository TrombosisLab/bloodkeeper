import assert from 'node:assert/strict'
import test from 'node:test'
import 'reflect-metadata'

import {
  RequestMethod,
} from '@nestjs/common'

import {
  UserAdministrationController,
} from '../dist/users/presentation/user-administration.controller.js'

const administratorId =
  '813bbaf8-3a1c-4dc4-989f-5f8a6267bbbc'

function user() {
  const now =
    new Date('2026-08-04T20:00:00.000Z')

  return {
    id:
      '775a3cb0-7509-49db-9665-5d2d881cb397',
    username: 'jugador',
    displayName: 'Jugador',
    status: 'active',
    roles: ['player'],
    createdAt: now,
    updatedAt: now,
  }
}

function controller() {
  const calls = []

  return {
    calls,
    instance:
      new UserAdministrationController(
        {
          async execute(command) {
            calls.push([
              'create',
              command,
            ])
            return user()
          },
        },
        {
          async execute(query) {
            calls.push([
              'list',
              query,
            ])
            return {
              items: [user()],
              nextOffset: null,
            }
          },
        },
      ),
  }
}

function adminRequest() {
  return {
    user: {
      id: administratorId,
      roles: ['admin'],
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
  '016-A publica POST y GET sobre /users',
  () => {
    assert.equal(
      Reflect.getMetadata(
        'path',
        UserAdministrationController,
      ),
      'users',
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
        UserAdministrationController
          .prototype[method]

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
  '016-A exige sesión y rol administrador',
  async () => {
    const { instance, calls } =
      controller()

    await assert.rejects(
      instance.list({}),
      hasStatus(401),
    )

    await assert.rejects(
      instance.list({
        user: {
          id: administratorId,
          roles: ['narrator'],
        },
      }),
      hasStatus(403),
    )

    assert.deepEqual(calls, [])
  },
)

test(
  '016-A crea y consulta usuarios sin exponer credenciales',
  async () => {
    const { instance, calls } =
      controller()

    const created =
      await instance.create(
        adminRequest(),
        {
          username: 'jugador',
          displayName: 'Jugador',
          password:
            'contraseña-segura-016',
          roles: ['player'],
        },
      )

    const listed =
      await instance.list(
        adminRequest(),
      )

    assert.equal(
      created.username,
      'jugador',
    )
    assert.equal(
      'passwordHash' in created,
      false,
    )
    assert.equal(listed.items.length, 1)
    assert.equal(listed.nextOffset, null)
    assert.deepEqual(calls, [
      [
        'create',
        {
          username: 'jugador',
          displayName: 'Jugador',
          password:
            'contraseña-segura-016',
          roles: ['player'],
        },
      ],
      [
        'list',
        {
          limit: 25,
          offset: 0,
        },
      ],
    ])
  },
)

test(
  'SPEC-053-A rechaza paginación inválida antes del caso de uso',
  async () => {
    const { instance, calls } =
      controller()

    await assert.rejects(
      instance.list(
        adminRequest(),
        {
          limit: '51',
        },
      ),
      hasStatus(400),
    )

    assert.deepEqual(calls, [])
  },
)
