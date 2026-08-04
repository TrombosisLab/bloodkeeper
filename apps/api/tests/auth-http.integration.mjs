import assert from 'node:assert/strict'
import {
  randomUUID,
} from 'node:crypto'
import test from 'node:test'

import {
  DatabaseService,
} from '../dist/database/database.service.js'

import {
  PrismaAuthUserRepository,
} from '../dist/auth/infrastructure/prisma-auth-user.repository.js'

import {
  ScryptPasswordHasher,
} from '../dist/auth/infrastructure/scrypt-password-hasher.js'

test(
  '015-B completa login sesión y logout por HTTP',
  async () => {
    const database =
      new DatabaseService()

    const users =
      new PrismaAuthUserRepository(
        database,
      )

    const passwords =
      new ScryptPasswordHasher()

    const username =
      `http-${randomUUID()}`

    const plainPassword =
      'contraseña-http-segura'

    await database.$connect()

    try {
      await users.create({
        username,
        displayName:
          'Narrador HTTP',
        passwordHash:
          await passwords.hash(
            plainPassword,
          ),
        status: 'active',
        roles: [
          'narrator',
          'player',
        ],
      })

      const login =
        await fetch(
          'http://127.0.0.1:3000/auth/login',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              username,
              password:
                plainPassword,
            }),
          },
        )

      assert.equal(
        login.status,
        200,
      )

      const setCookie =
        login.headers.get(
          'set-cookie',
        )

      assert.ok(setCookie)
      assert.match(
        setCookie,
        /bk_session=/,
      )
      assert.match(
        setCookie,
        /HttpOnly/i,
      )
      assert.match(
        setCookie,
        /SameSite=Strict/i,
      )

      const cookie =
        setCookie.split(';')[0]

      const current =
        await fetch(
          'http://127.0.0.1:3000/auth/session',
          {
            headers: {
              Cookie: cookie,
            },
          },
        )

      assert.equal(
        current.status,
        200,
      )

      const currentBody =
        await current.json()

      assert.equal(
        currentBody.user.username,
        username,
      )
      assert.equal(
        'passwordHash' in
          currentBody.user,
        false,
      )

      const logout =
        await fetch(
          'http://127.0.0.1:3000/auth/logout',
          {
            method: 'POST',
            headers: {
              Cookie: cookie,
            },
          },
        )

      assert.equal(
        logout.status,
        204,
      )

      const afterLogout =
        await fetch(
          'http://127.0.0.1:3000/auth/session',
          {
            headers: {
              Cookie: cookie,
            },
          },
        )

      assert.equal(
        afterLogout.status,
        401,
      )
    } finally {
      await database.user.deleteMany({
        where: {
          username,
        },
      })
      await database.$disconnect()
    }
  },
)
