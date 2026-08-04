import assert from 'node:assert/strict'
import test from 'node:test'

import {
  UnauthorizedException,
} from '@nestjs/common'

import {
  AuthController,
} from '../dist/auth/presentation/auth.controller.js'

import {
  InvalidCredentialsError,
} from '../dist/auth/application/login.use-case.js'

function responseSpy() {
  const calls = []

  return {
    calls,
    cookie(...args) {
      calls.push([
        'cookie',
        ...args,
      ])
    },
    clearCookie(...args) {
      calls.push([
        'clearCookie',
        ...args,
      ])
    },
  }
}

test(
  '015-B login responde con identidad pública y cookie segura',
  async () => {
    const expiresAt =
      new Date(
        Date.now() + 60_000,
      )

    const controller =
      new AuthController(
        {
          async execute() {
            return {
              user: {
                id: 'user-id',
                username: 'narrador',
                displayName:
                  'Narrador',
                roles: ['narrator'],
              },
              sessionToken:
                'raw-token',
              expiresAt,
            }
          },
        },
        {
          async execute() {
            return true
          },
        },
      )

    const response =
      responseSpy()

    const result =
      await controller.login(
        {
          username: 'narrador',
          password:
            'contraseña-segura',
        },
        {
          headers: {},
          secure: false,
        },
        response,
      )

    assert.equal(
      result.user.username,
      'narrador',
    )
    assert.equal(
      'passwordHash' in result.user,
      false,
    )
    assert.equal(
      response.calls[0][0],
      'cookie',
    )
    assert.equal(
      response.calls[0][1],
      'bk_session',
    )
    assert.equal(
      response.calls[0][3].httpOnly,
      true,
    )
    assert.equal(
      response.calls[0][3].sameSite,
      'strict',
    )
    assert.equal(
      response.calls[0][3].path,
      '/',
    )
  },
)

test(
  '015-B login usa un error genérico para credenciales inválidas',
  async () => {
    const controller =
      new AuthController(
        {
          async execute() {
            throw new InvalidCredentialsError()
          },
        },
        {
          async execute() {
            return false
          },
        },
      )

    await assert.rejects(
      controller.login(
        {
          username: 'desconocido',
          password: 'incorrecta',
        },
        {
          headers: {},
        },
        responseSpy(),
      ),
      (error) =>
        error instanceof
          UnauthorizedException &&
        error.getResponse().code ===
          'INVALID_CREDENTIALS',
    )
  },
)

test(
  '015-B consulta sesión autenticada y rechaza acceso anónimo',
  () => {
    const controller =
      new AuthController(
        {
          async execute() {
            throw new Error('unexpected')
          },
        },
        {
          async execute() {
            return false
          },
        },
      )

    const user = {
      id: 'user-id',
      username: 'narrador',
      displayName: 'Narrador',
      roles: ['narrator'],
    }

    assert.deepEqual(
      controller.currentSession({
        headers: {},
        user,
      }),
      {
        user,
      },
    )

    assert.throws(
      () =>
        controller.currentSession({
          headers: {},
        }),
      UnauthorizedException,
    )
  },
)

test(
  '015-B logout revoca la sesión presente y elimina la cookie',
  async () => {
    const revoked = []
    const response =
      responseSpy()

    const controller =
      new AuthController(
        {
          async execute() {
            throw new Error('unexpected')
          },
        },
        {
          async execute(token) {
            revoked.push(token)
            return true
          },
        },
      )

    await controller.logout(
      {
        headers: {},
        authSessionToken:
          'raw-token',
      },
      response,
    )

    assert.deepEqual(
      revoked,
      ['raw-token'],
    )
    assert.equal(
      response.calls[0][0],
      'clearCookie',
    )
  },
)
