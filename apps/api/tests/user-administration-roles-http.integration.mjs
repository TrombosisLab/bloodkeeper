import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
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

const API = 'http://127.0.0.1:3000'

async function login(
  username,
  password,
) {
  const response =
    await fetch(
      `${API}/auth/login`,
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

  const cookie =
    response.headers
      .get('set-cookie')
      ?.split(';')[0] ?? null

  return { response, cookie }
}

test(
  '016 roles integra asignación administrativa y refresco desde sesión',
  async () => {
    const database = new DatabaseService()
    const users =
      new PrismaAuthUserRepository(
        database,
      )
    const passwords =
      new ScryptPasswordHasher()

    const suffix =
      randomUUID().slice(0, 12)
    const adminUsername =
      `roles-admin-${suffix}`
    const targetUsername =
      `roles-target-${suffix}`
    const password =
      'contraseña-integración-roles'

    await database.$connect()

    const admin =
      await users.create({
        username: adminUsername,
        displayName: 'Administrador Roles',
        passwordHash:
          await passwords.hash(password),
        status: 'active',
        roles: ['admin'],
      })

    const target =
      await users.create({
        username: targetUsername,
        displayName: 'Objetivo Roles',
        passwordHash:
          await passwords.hash(password),
        status: 'active',
        roles: ['player'],
      })

    try {
      const anonymous =
        await fetch(
          `${API}/users/${target.id}/roles`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              roles: ['narrator'],
            }),
          },
        )
      assert.equal(anonymous.status, 401)

      const adminLogin =
        await login(
          adminUsername,
          password,
        )
      assert.equal(
        adminLogin.response.status,
        200,
      )
      assert.ok(adminLogin.cookie)

      const targetLogin =
        await login(
          targetUsername,
          password,
        )
      assert.equal(
        targetLogin.response.status,
        200,
      )
      assert.ok(targetLogin.cookie)

      const updated =
        await fetch(
          `${API}/users/${target.id}/roles`,
          {
            method: 'PATCH',
            headers: {
              Cookie: adminLogin.cookie,
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              roles: [
                'player',
                'narrator',
              ],
            }),
          },
        )

      assert.equal(updated.status, 200)
      const updatedBody =
        await updated.json()

      assert.deepEqual(
        updatedBody.roles,
        ['narrator', 'player'],
      )
      assert.equal(
        updatedBody.username,
        targetUsername,
      )
      assert.equal(
        'passwordHash' in updatedBody,
        false,
      )
      assert.equal(
        'permissions' in updatedBody,
        false,
      )

      const currentSession =
        await fetch(
          `${API}/auth/session`,
          {
            headers: {
              Cookie: targetLogin.cookie,
            },
          },
        )

      assert.equal(
        currentSession.status,
        200,
      )
      const sessionBody =
        await currentSession.json()
      assert.deepEqual(
        sessionBody.user.roles,
        ['narrator', 'player'],
      )

      const denied =
        await fetch(
          `${API}/users/${admin.id}/roles`,
          {
            method: 'PATCH',
            headers: {
              Cookie: targetLogin.cookie,
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              roles: ['player'],
            }),
          },
        )
      assert.equal(denied.status, 403)

      for (const [body, status] of [
        [{ roles: [] }, 422],
        [
          {
            roles: [
              'player',
              'player',
            ],
          },
          422,
        ],
        [{ roles: ['superadmin'] }, 400],
      ]) {
        const response =
          await fetch(
            `${API}/users/${target.id}/roles`,
            {
              method: 'PATCH',
              headers: {
                Cookie: adminLogin.cookie,
                'Content-Type':
                  'application/json',
              },
              body: JSON.stringify(body),
            },
          )

        assert.equal(
          response.status,
          status,
        )
      }

      const missing =
        await fetch(
          `${API}/users/${randomUUID()}/roles`,
          {
            method: 'PATCH',
            headers: {
              Cookie: adminLogin.cookie,
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              roles: ['player'],
            }),
          },
        )
      assert.equal(missing.status, 404)
    } finally {
      await database.authSession.deleteMany({
        where: {
          userId: {
            in: [
              admin.id,
              target.id,
            ],
          },
        },
      })

      await database.user.deleteMany({
        where: {
          id: {
            in: [
              admin.id,
              target.id,
            ],
          },
        },
      })

      await database.$disconnect()
    }
  },
)
