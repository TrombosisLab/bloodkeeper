import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InvalidUserAdministrationRequestError,
  parseAuthenticatedAdministratorId,
  parseCreateUserAdministrationRequest,
  toUserAdministrationResponse,
} from '../dist/users/presentation/user-administration.dto.js'

const administratorId =
  '813bbaf8-3a1c-4dc4-989f-5f8a6267bbbc'

test(
  '016-A valida identidad y cuerpo explícito',
  () => {
    assert.equal(
      parseAuthenticatedAdministratorId(
        administratorId,
      ),
      administratorId,
    )

    assert.deepEqual(
      parseCreateUserAdministrationRequest({
        username: 'jugador',
        displayName: 'Jugador',
        password:
          'contraseña-segura-016',
        roles: [
          'narrator',
          'player',
        ],
      }),
      {
        username: 'jugador',
        displayName: 'Jugador',
        password:
          'contraseña-segura-016',
        roles: [
          'narrator',
          'player',
        ],
      },
    )
  },
)

test(
  '016-A rechaza campos y roles desconocidos',
  () => {
    assert.throws(
      () =>
        parseAuthenticatedAdministratorId(
          'invalid',
        ),
      InvalidUserAdministrationRequestError,
    )

    assert.throws(
      () =>
        parseCreateUserAdministrationRequest({
          username: 'jugador',
          displayName: 'Jugador',
          password:
            'contraseña-segura-016',
          roles: ['owner'],
        }),
      /supported role/,
    )

    assert.throws(
      () =>
        parseCreateUserAdministrationRequest({
          username: 'jugador',
          displayName: 'Jugador',
          password:
            'contraseña-segura-016',
          roles: ['player'],
          passwordHash: 'forbidden',
        }),
      /is not allowed/,
    )
  },
)

test(
  '016-A nunca expone hash ni contraseña',
  () => {
    const now =
      new Date('2026-08-04T20:00:00.000Z')

    const response =
      toUserAdministrationResponse({
        id: administratorId,
        username: 'jugador',
        displayName: 'Jugador',
        status: 'active',
        roles: ['player'],
        createdAt: now,
        updatedAt: now,
      })

    assert.equal(
      'password' in response,
      false,
    )
    assert.equal(
      'passwordHash' in response,
      false,
    )
    assert.equal(
      response.createdAt,
      now.toISOString(),
    )
  },
)
