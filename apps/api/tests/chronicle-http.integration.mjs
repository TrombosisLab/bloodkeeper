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
  '030-B integra autenticación y permiso de narrador por HTTP',
  async () => {
    const database =
      new DatabaseService()

    const users =
      new PrismaAuthUserRepository(
        database,
      )

    const passwords =
      new ScryptPasswordHasher()

    const suffix = randomUUID()
    const narratorUsername =
      `chronicle-narrator-${suffix}`
    const playerUsername =
      `chronicle-player-${suffix}`
    const password =
      'contraseña-integración-crónica'

    await database.$connect()

    const narrator =
      await users.create({
        username: narratorUsername,
        displayName:
          'Narrador de integración',
        passwordHash:
          await passwords.hash(password),
        status: 'active',
        roles: [
          'narrator',
          'player',
        ],
      })

    const player =
      await users.create({
        username: playerUsername,
        displayName:
          'Jugador de integración',
        passwordHash:
          await passwords.hash(password),
        status: 'active',
        roles: ['player'],
      })

    try {
      const anonymous =
        await fetch(
          `${api}/chronicles`,
        )

      assert.equal(
        anonymous.status,
        401,
      )

      const narratorCookie =
        await login(
          narratorUsername,
          password,
        )

      const created =
        await fetch(
          `${api}/chronicles`,
          {
            method: 'POST',
            headers: {
              Cookie:
                narratorCookie,
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              name:
                'Noches de integración',
              description:
                'Prueba 030-B.',
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
        createdBody.narratorId,
        narrator.id,
      )

      const listed =
        await fetch(
          `${api}/chronicles`,
          {
            headers: {
              Cookie:
                narratorCookie,
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
        Array.isArray(
          listedBody.items,
        ),
        true,
      )

      assert.equal(
        listedBody.items.some(
          (chronicle) =>
            chronicle.id ===
              createdBody.id &&
            chronicle.narratorId ===
              narrator.id,
        ),
        true,
      )

      const playerCookie =
        await login(
          playerUsername,
          password,
        )

      const denied =
        await fetch(
          `${api}/chronicles`,
          {
            method: 'POST',
            headers: {
              Cookie: playerCookie,
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              name:
                'Crónica no autorizada',
              description: null,
            }),
          },
        )

      assert.equal(
        denied.status,
        403,
      )

      const deniedBody =
        await denied.json()

      assert.equal(
        deniedBody.code,
        'CHRONICLE_PERMISSION_DENIED',
      )
    } finally {
      await database.chronicleParticipant.deleteMany({
        where: {
          userId: {
            in: [
              narrator.id,
              player.id,
            ],
          },
        },
      })

      await database.chronicle.deleteMany({
        where: {
          narratorId: {
            in: [
              narrator.id,
              player.id,
            ],
          },
        },
      })

      await database.user.deleteMany({
        where: {
          id: {
            in: [
              narrator.id,
              player.id,
            ],
          },
        },
      })

      await database.$disconnect()
    }
  },
)
