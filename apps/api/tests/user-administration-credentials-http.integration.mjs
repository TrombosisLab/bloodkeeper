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

async function patchCredentials(
  userId,
  body,
  cookie = null,
) {
  return fetch(
    `${API}/users/${userId}/credentials`,
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
  '016 credenciales integra reset administrativo seguro por HTTP',
  async () => {
    const database =
      new DatabaseService()
    const passwords =
      new ScryptPasswordHasher()

    const suffix =
      randomUUID().slice(0, 10)

    const adminUsername =
      `cred-admin-${suffix}`
    const targetUsername =
      `cred-user-${suffix}`

    const oldPassword =
      'Operational-016C-Old-Password!'
    const newPassword =
      'Operational-016C-New-Password!'

    await database.$connect()

    try {
      const admin =
        await database.user.create({
          data: {
            username:
              adminUsername,
            displayName:
              '016 Credentials Admin',
            passwordHash:
              await passwords.hash(
                oldPassword,
              ),
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
              '016 Credentials Target',
            passwordHash:
              await passwords.hash(
                oldPassword,
              ),
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
          oldPassword,
        )

      assert.equal(
        adminLogin.response.status,
        200,
      )
      assert.ok(adminLogin.cookie)

      const targetLogin =
        await login(
          targetUsername,
          oldPassword,
        )

      assert.equal(
        targetLogin.response.status,
        200,
      )
      assert.ok(targetLogin.cookie)

      const anonymous =
        await patchCredentials(
          target.id,
          {
            password: newPassword,
          },
        )

      assert.equal(
        anonymous.status,
        401,
      )

      const denied =
        await patchCredentials(
          target.id,
          {
            password: newPassword,
          },
          targetLogin.cookie,
        )

      assert.equal(
        denied.status,
        403,
      )

      const unknownField =
        await patchCredentials(
          target.id,
          {
            password: newPassword,
            roles: ['admin'],
          },
          adminLogin.cookie,
        )

      assert.equal(
        unknownField.status,
        400,
      )

      const malformedId =
        await patchCredentials(
          'not-a-uuid',
          {
            password: newPassword,
          },
          adminLogin.cookie,
        )

      assert.equal(
        malformedId.status,
        400,
      )

      const invalidPassword =
        await patchCredentials(
          target.id,
          {
            password: 'corta',
          },
          adminLogin.cookie,
        )

      assert.equal(
        invalidPassword.status,
        422,
      )

      const missing =
        await patchCredentials(
          randomUUID(),
          {
            password: newPassword,
          },
          adminLogin.cookie,
        )

      assert.equal(
        missing.status,
        404,
      )

      const updated =
        await patchCredentials(
          target.id,
          {
            password: newPassword,
          },
          adminLogin.cookie,
        )

      assert.equal(
        updated.status,
        200,
      )

      const updatedBody =
        await updated.json()

      assert.equal(
        updatedBody.id,
        target.id,
      )
      assert.equal(
        updatedBody.username,
        targetUsername,
      )
      assert.equal(
        updatedBody.displayName,
        '016 Credentials Target',
      )
      assert.equal(
        updatedBody.status,
        'active',
      )
      assert.deepEqual(
        updatedBody.roles,
        ['player'],
      )
      assert.equal(
        'password' in updatedBody,
        false,
      )
      assert.equal(
        'passwordHash' in updatedBody,
        false,
      )

      const row =
        await database.user.findUnique({
          where: {
            id: target.id,
          },
        })

      assert.ok(row)
      assert.equal(
        await passwords.verify(
          oldPassword,
          row.passwordHash,
        ),
        false,
      )
      assert.equal(
        await passwords.verify(
          newPassword,
          row.passwordHash,
        ),
        true,
      )
      assert.equal(
        row.displayName,
        '016 Credentials Target',
      )
      assert.equal(
        row.status,
        PrismaUserStatus.ACTIVE,
      )
      assert.deepEqual(
        row.roles,
        [PrismaUserRole.PLAYER],
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

      const oldLogin =
        await login(
          targetUsername,
          oldPassword,
        )

      assert.equal(
        oldLogin.response.status,
        401,
      )

      const newLogin =
        await login(
          targetUsername,
          newPassword,
        )

      assert.equal(
        newLogin.response.status,
        200,
      )
      assert.ok(newLogin.cookie)

      const adminStillValid =
        await fetch(
          `${API}/users`,
          {
            headers: {
              cookie:
                adminLogin.cookie,
            },
          },
        )

      assert.equal(
        adminStillValid.status,
        200,
      )
    } finally {
      await database.user.deleteMany({
        where: {
          username: {
            in: [
              adminUsername,
              targetUsername,
            ],
          },
        },
      })

      await database.$disconnect()
    }
  },
)
