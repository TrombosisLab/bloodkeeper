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

const api =
  'http://127.0.0.1:3000'

async function login(
  username,
  password,
) {
  const response =
    await fetch(
      `${api}/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      },
    )

  assert.equal(response.status, 200)

  const setCookie =
    response.headers.get(
      'set-cookie',
    )

  assert.ok(setCookie)

  return setCookie.split(';')[0]
}

test(
  '016-A integra alta consulta y autorización administrativa por HTTP',
  async () => {
    const database =
      new DatabaseService()

    const users =
      new PrismaAuthUserRepository(
        database,
      )

    const passwords =
      new ScryptPasswordHasher()

    const suffix =
      randomUUID().slice(0, 12)
    const adminUsername =
      `users-admin-${suffix}`
    const playerUsername =
      `users-player-${suffix}`
    const createdUsername =
      `users-created-${suffix}`
    const password =
      'contraseña-integración-usuarios'

    await database.$connect()

    const admin =
      await users.create({
        username: adminUsername,
        displayName:
          'Administrador HTTP',
        passwordHash:
          await passwords.hash(password),
        status: 'active',
        roles: [
          'admin',
          'narrator',
          'player',
        ],
      })

    const player =
      await users.create({
        username: playerUsername,
        displayName: 'Jugador HTTP',
        passwordHash:
          await passwords.hash(password),
        status: 'active',
        roles: ['player'],
      })

    try {
      const anonymous =
        await fetch(`${api}/users`)

      assert.equal(
        anonymous.status,
        401,
      )

      const adminCookie =
        await login(
          adminUsername,
          password,
        )

      const created =
        await fetch(
          `${api}/users`,
          {
            method: 'POST',
            headers: {
              Cookie: adminCookie,
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              username:
                createdUsername.toUpperCase(),
              displayName:
                ' Usuario Creado ',
              password:
                'contraseña-usuario-creado',
              roles: ['player'],
            }),
          },
        )

      assert.equal(
        created.status,
        201,
      )

      const createdBody =
        await created.json()

      assert.equal(
        createdBody.username,
        createdUsername,
      )
      assert.equal(
        createdBody.status,
        'active',
      )
      assert.equal(
        'passwordHash' in createdBody,
        false,
      )

      const duplicate =
        await fetch(
          `${api}/users`,
          {
            method: 'POST',
            headers: {
              Cookie: adminCookie,
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              username:
                createdUsername,
              displayName:
                'Duplicado',
              password:
                'contraseña-usuario-duplicado',
              roles: ['player'],
            }),
          },
        )

      assert.equal(
        duplicate.status,
        409,
      )

      const listed =
        await fetch(
          `${api}/users?limit=50&offset=0`,
          {
            headers: {
              Cookie: adminCookie,
            },
          },
        )

      assert.equal(
        listed.status,
        200,
      )

      const listedBody =
        await listed.json()

      assert.equal(
        listedBody.items.some(
          (user) =>
            user.id ===
              createdBody.id &&
            user.username ===
              createdUsername,
        ),
        true,
      )

      assert.ok(
        Array.isArray(
          listedBody.items,
        ),
      )
      assert.equal(
        listedBody.items.length <= 50,
        true,
      )
      assert.equal(
        listedBody.nextOffset === null ||
          Number.isSafeInteger(
            listedBody.nextOffset,
          ),
        true,
      )

      const invalidPagination =
        await fetch(
          `${api}/users?limit=51`,
          {
            headers: {
              Cookie: adminCookie,
            },
          },
        )

      assert.equal(
        invalidPagination.status,
        400,
      )

      assert.equal(
        (
          await invalidPagination.json()
        ).code,
        'INVALID_PAGINATION_QUERY',
      )

      const playerCookie =
        await login(
          playerUsername,
          password,
        )

      const denied =
        await fetch(
          `${api}/users`,
          {
            headers: {
              Cookie: playerCookie,
            },
          },
        )

      assert.equal(
        denied.status,
        403,
      )
    } finally {
      await database.user.deleteMany({
        where: {
          id: {
            in: [
              admin.id,
              player.id,
            ],
          },
        },
      })

      await database.user.deleteMany({
        where: {
          username:
            createdUsername,
        },
      })

      await database.$disconnect()
    }
  },
)
