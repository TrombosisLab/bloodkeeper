import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'
import 'reflect-metadata'

import {
  RequestMethod,
} from '@nestjs/common'

import {
  AuthRecoveryUserNotFoundError,
} from '../dist/auth/application/reset-user-password.use-case.js'

import {
  InvalidAuthUserError,
} from '../dist/auth/domain/auth-user.rules.js'

import {
  ResetUserCredentialsUseCase,
} from '../dist/users/application/reset-user-credentials.use-case.js'

import {
  UserAdministrationUserNotFoundError,
} from '../dist/users/application/update-user.use-case.js'

import {
  UserAdministrationController,
} from '../dist/users/presentation/user-administration.controller.js'

import {
  InvalidUserAdministrationRequestError,
  parseResetUserCredentialsRequest,
} from '../dist/users/presentation/user-administration.dto.js'

const administratorId =
  '813bbaf8-3a1c-4dc4-989f-5f8a6267bbbc'

const targetId =
  '775a3cb0-7509-49db-9665-5d2d881cb397'

function publicUser(overrides = {}) {
  const now =
    new Date('2026-08-07T17:30:00.000Z')

  return {
    id: targetId,
    username: 'jugador',
    displayName: 'Jugador',
    status: 'active',
    roles: ['player'],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function authUser(overrides = {}) {
  return {
    ...publicUser(),
    passwordHash: 'scrypt$updated',
    ...overrides,
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

function controller(
  resetCredentials,
) {
  return new UserAdministrationController(
    {
      async execute() {
        return publicUser()
      },
    },
    {
      async execute() {
        return [publicUser()]
      },
    },
    {
      async execute() {
        return publicUser()
      },
    },
    resetCredentials,
  )
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
  '016 credenciales valida UUID y admite únicamente password',
  () => {
    assert.deepEqual(
      parseResetUserCredentialsRequest(
        targetId,
        {
          password:
            'nueva-contraseña-segura',
        },
      ),
      {
        userId: targetId,
        password:
          'nueva-contraseña-segura',
      },
    )

    for (const [userId, body] of [
      [
        'not-a-uuid',
        {
          password:
            'nueva-contraseña-segura',
        },
      ],
      [
        targetId,
        {},
      ],
      [
        targetId,
        {
          password:
            'nueva-contraseña-segura',
          roles: ['admin'],
        },
      ],
      [
        targetId,
        {
          password: 123,
        },
      ],
    ]) {
      assert.throws(
        () =>
          parseResetUserCredentialsRequest(
            userId,
            body,
          ),
        InvalidUserAdministrationRequestError,
      )
    }
  },
)

test(
  '016 credenciales reutiliza ResetUserPasswordUseCase por usuario seleccionado',
  async () => {
    const calls = []
    const current =
      publicUser()

    const useCase =
      new ResetUserCredentialsUseCase(
        {
          async findById(userId) {
            calls.push([
              'findById',
              userId,
            ])
            return current
          },
        },
        {
          async execute(input) {
            calls.push([
              'resetPassword',
              input,
            ])
            return authUser({
              updatedAt:
                new Date(
                  '2026-08-07T17:35:00.000Z',
                ),
            })
          },
        },
      )

    const result =
      await useCase.execute({
        userId: targetId,
        password:
          'nueva-contraseña-segura',
      })

    assert.deepEqual(calls, [
      [
        'findById',
        targetId,
      ],
      [
        'resetPassword',
        {
          username: 'jugador',
          password:
            'nueva-contraseña-segura',
        },
      ],
    ])

    assert.equal(
      result.id,
      targetId,
    )
    assert.equal(
      result.username,
      'jugador',
    )
    assert.equal(
      result.displayName,
      'Jugador',
    )
    assert.equal(
      result.status,
      'active',
    )
    assert.deepEqual(
      result.roles,
      ['player'],
    )
    assert.equal(
      'passwordHash' in result,
      false,
    )
  },
)

test(
  '016 credenciales rechaza usuario inexistente sin tocar Auth',
  async () => {
    let resetTouched = false

    const useCase =
      new ResetUserCredentialsUseCase(
        {
          async findById() {
            return null
          },
        },
        {
          async execute() {
            resetTouched = true
            throw new Error('unexpected')
          },
        },
      )

    await assert.rejects(
      useCase.execute({
        userId: targetId,
        password:
          'nueva-contraseña-segura',
      }),
      UserAdministrationUserNotFoundError,
    )

    assert.equal(
      resetTouched,
      false,
    )
  },
)

test(
  '016 credenciales traduce una desaparición concurrente de Auth a USER_NOT_FOUND',
  async () => {
    const useCase =
      new ResetUserCredentialsUseCase(
        {
          async findById() {
            return publicUser()
          },
        },
        {
          async execute() {
            throw new AuthRecoveryUserNotFoundError()
          },
        },
      )

    await assert.rejects(
      useCase.execute({
        userId: targetId,
        password:
          'nueva-contraseña-segura',
      }),
      UserAdministrationUserNotFoundError,
    )
  },
)

test(
  '016 credenciales publica PATCH /users/:userId/credentials y exige admin',
  async () => {
    const handler =
      UserAdministrationController
        .prototype.resetCredentials

    assert.equal(
      Reflect.getMetadata(
        'path',
        handler,
      ),
      ':userId/credentials',
    )
    assert.equal(
      Reflect.getMetadata(
        'method',
        handler,
      ),
      RequestMethod.PATCH,
    )

    let touched = false
    const instance =
      controller({
        async execute() {
          touched = true
          return publicUser()
        },
      })

    await assert.rejects(
      instance.resetCredentials(
        {},
        targetId,
        {
          password:
            'nueva-contraseña-segura',
        },
      ),
      hasStatus(401),
    )

    await assert.rejects(
      instance.resetCredentials(
        {
          user: {
            id: administratorId,
            roles: ['player'],
          },
        },
        targetId,
        {
          password:
            'nueva-contraseña-segura',
        },
      ),
      hasStatus(403),
    )

    assert.equal(touched, false)
  },
)

test(
  '016 credenciales devuelve respuesta pública y mapea validación segura',
  async () => {
    const success =
      controller({
        async execute(command) {
          assert.deepEqual(
            command,
            {
              userId: targetId,
              password:
                'nueva-contraseña-segura',
            },
          )
          return publicUser()
        },
      })

    const result =
      await success.resetCredentials(
        adminRequest(),
        targetId,
        {
          password:
            'nueva-contraseña-segura',
        },
      )

    assert.equal(
      result.id,
      targetId,
    )
    assert.equal(
      'password' in result,
      false,
    )
    assert.equal(
      'passwordHash' in result,
      false,
    )

    const invalid =
      controller({
        async execute() {
          throw new InvalidAuthUserError([
            {
              code:
                'AUTH_PASSWORD_TOO_SHORT',
              field: 'password',
              message:
                'La contraseña debe contener al menos 12 caracteres.',
            },
          ])
        },
      })

    await assert.rejects(
      invalid.resetCredentials(
        adminRequest(),
        targetId,
        {
          password: 'corta',
        },
      ),
      hasStatus(422),
    )

    const missing =
      controller({
        async execute() {
          throw new UserAdministrationUserNotFoundError()
        },
      })

    await assert.rejects(
      missing.resetCredentials(
        adminRequest(),
        targetId,
        {
          password:
            'nueva-contraseña-segura',
        },
      ),
      hasStatus(404),
    )
  },
)

test(
  '016 credenciales compone USERS sobre el reset seguro de AUTH sin duplicarlo',
  async () => {
    const moduleSource =
      await readFile(
        new URL(
          '../src/users/users.module.ts',
          import.meta.url,
        ),
        'utf8',
      )
    const useCaseSource =
      await readFile(
        new URL(
          '../src/users/application/reset-user-credentials.use-case.ts',
          import.meta.url,
        ),
        'utf8',
      )
    const controllerSource =
      await readFile(
        new URL(
          '../src/users/presentation/user-administration.controller.ts',
          import.meta.url,
        ),
        'utf8',
      )

    assert.match(
      moduleSource,
      /ResetUserPasswordUseCase/,
    )
    assert.match(
      moduleSource,
      /ResetUserCredentialsUseCase/,
    )
    assert.match(
      useCaseSource,
      /resetPassword\.execute/,
    )
    assert.doesNotMatch(
      useCaseSource,
      /\.hash\(|updatePasswordHash|revokeAllByUserId/,
    )
    assert.doesNotMatch(
      controllerSource,
      /passwordHash\s*:/,
    )
  },
)
