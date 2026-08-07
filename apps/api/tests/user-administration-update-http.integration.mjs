import assert from 'node:assert/strict'
import {
  randomUUID,
} from 'node:crypto'
import test from 'node:test'

import {
  UserAccountStatus as PrismaUserStatus,
  UserRole as PrismaUserRole,
} from '@prisma/client'

import {
  DatabaseService,
} from '../dist/database/database.service.js'

import {
  ScryptPasswordHasher,
} from '../dist/auth/infrastructure/scrypt-password-hasher.js'

const API =
  'http://127.0.0.1:3000'

function cookieFrom(
  response,
) {
  return (
    response.headers
      .get('set-cookie')
      ?.split(';')[0] ??
    null
  )
}

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
          'content-type':
            'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      },
    )

  return {
    response,
    cookie:
      cookieFrom(response),
  }
}

async function patchUser(
  userId,
  body,
  cookie = null,
) {
  return fetch(
    `${API}/users/${userId}`,
    {
      method: 'PATCH',
      headers: {
        'content-type':
          'application/json',
        ...(cookie === null
          ? {}
          : {
              cookie,
            }),
      },
      body: JSON.stringify(body),
    },
  )
}

test(
  '016-B integra edición estado autorización y revocación por HTTP',
  async () => {
    const database =
      new DatabaseService()
    const passwords =
      new ScryptPasswordHasher()

    const suffix =
      randomUUID().slice(0, 10)

    const adminUsername =
      `upd-admin-${suffix}`
    const targetUsername =
      `upd-user-${suffix}`
    const occupiedUsername =
      `upd-taken-${suffix}`
    const updatedUsername =
      `upd-new-${suffix}`

    const password =
      'Operational-016B-Password!'

    await database.$connect()

    try {
      const passwordHash =
        await passwords.hash(
          password,
        )

      const admin =
        await database.user.create({
          data: {
            username:
              adminUsername,
            displayName:
              '016-B Admin',
            passwordHash,
            status:
              PrismaUserStatus.ACTIVE,
            roles: [
              PrismaUserRole.ADMIN,
              PrismaUserRole.NARRATOR,
              PrismaUserRole.PLAYER,
            ],
          },
        })

      const target =
        await database.user.create({
          data: {
            username:
              targetUsername,
            displayName:
              '016-B Target',
            passwordHash,
            status:
              PrismaUserStatus.ACTIVE,
            roles: [
              PrismaUserRole.PLAYER,
            ],
          },
        })

      await database.user.create({
        data: {
          username:
            occupiedUsername,
          displayName:
            '016-B Occupied',
          passwordHash,
          status:
            PrismaUserStatus.ACTIVE,
          roles: [
            PrismaUserRole.PLAYER,
          ],
        },
      })

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

      const anonymous =
        await patchUser(
          target.id,
          {
            displayName:
              'Anonymous',
          },
        )

      assert.equal(
        anonymous.status,
        401,
      )

      const denied =
        await patchUser(
          admin.id,
          {
            displayName:
              'Denied',
          },
          targetLogin.cookie,
        )

      assert.equal(
        denied.status,
        403,
      )

      const unknownField =
        await patchUser(
          target.id,
          {
            roles: ['admin'],
          },
          adminLogin.cookie,
        )

      assert.equal(
        unknownField.status,
        400,
      )

      const invalidRules =
        await patchUser(
          target.id,
          {
            username:
              'INVALID USER NAME',
          },
          adminLogin.cookie,
        )

      assert.equal(
        invalidRules.status,
        422,
      )

      const missing =
        await patchUser(
          randomUUID(),
          {
            status: 'disabled',
          },
          adminLogin.cookie,
        )

      assert.equal(
        missing.status,
        404,
      )

      const missingBody =
        await missing.json()

      assert.equal(
        missingBody.code,
        'USER_NOT_FOUND',
      )

      const duplicate =
        await patchUser(
          target.id,
          {
            username:
              occupiedUsername,
          },
          adminLogin.cookie,
        )

      assert.equal(
        duplicate.status,
        409,
      )

      const duplicateBody =
        await duplicate.json()

      assert.equal(
        duplicateBody.code,
        'USERNAME_ALREADY_EXISTS',
      )

      const disabled =
        await patchUser(
          target.id,
          {
            username:
              updatedUsername
                .toUpperCase(),
            displayName:
              '  Updated Target  ',
            status:
              'disabled',
          },
          adminLogin.cookie,
        )

      assert.equal(
        disabled.status,
        200,
      )

      const disabledBody =
        await disabled.json()

      assert.equal(
        disabledBody.id,
        target.id,
      )
      assert.equal(
        disabledBody.username,
        updatedUsername,
      )
      assert.equal(
        disabledBody.displayName,
        'Updated Target',
      )
      assert.equal(
        disabledBody.status,
        'disabled',
      )
      assert.deepEqual(
        disabledBody.roles,
        ['player'],
      )
      assert.equal(
        'password' in disabledBody,
        false,
      )
      assert.equal(
        'passwordHash' in disabledBody,
        false,
      )

      const sessions =
        await database.authSession.findMany({
          where: {
            userId: target.id,
          },
        })

      assert.ok(
        sessions.length >= 1,
      )
      assert.equal(
        sessions.every(
          (session) =>
            session.revokedAt !== null,
        ),
        true,
      )

      const oldSession =
        await fetch(
          `${API}/auth/session`,
          {
            headers: {
              cookie:
                targetLogin.cookie,
            },
          },
        )

      assert.equal(
        oldSession.status,
        401,
      )

      const disabledLogin =
        await login(
          updatedUsername,
          password,
        )

      assert.equal(
        disabledLogin.response.status,
        401,
      )

      const reactivated =
        await patchUser(
          target.id,
          {
            status: 'active',
          },
          adminLogin.cookie,
        )

      assert.equal(
        reactivated.status,
        200,
      )

      const reactivatedBody =
        await reactivated.json()

      assert.equal(
        reactivatedBody.status,
        'active',
      )

      const loginAfterReactivation =
        await login(
          updatedUsername,
          password,
        )

      assert.equal(
        loginAfterReactivation
          .response.status,
        200,
      )
    } finally {
      await database.user.deleteMany({
        where: {
          username: {
            in: [
              adminUsername,
              targetUsername,
              occupiedUsername,
              updatedUsername,
            ],
          },
        },
      })

      await database.$disconnect()
    }
  },
)
