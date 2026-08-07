import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import test from 'node:test'

import {
  UpdateUserRolesUseCase,
} from '../dist/users/application/update-user-roles.use-case.js'

import {
  UserAdministrationUserNotFoundError,
} from '../dist/users/application/update-user.use-case.js'

import {
  InvalidUserAdministrationError,
  normalizeUserAdministrationRoles,
} from '../dist/users/domain/user-administration.rules.js'

import {
  InvalidUserAdministrationRequestError,
  parseUpdateUserRolesRequest,
} from '../dist/users/presentation/user-administration.dto.js'

function user(overrides = {}) {
  return {
    id: randomUUID(),
    username: 'role-target',
    displayName: 'Role Target',
    status: 'active',
    roles: ['player'],
    createdAt: new Date('2026-08-07T18:00:00Z'),
    updatedAt: new Date('2026-08-07T18:00:00Z'),
    ...overrides,
  }
}

test('016 roles normaliza al orden canónico', () => {
  assert.deepEqual(
    normalizeUserAdministrationRoles([
      'player',
      'admin',
    ]),
    ['admin', 'player'],
  )
})

test(
  '016 roles exige al menos uno y rechaza duplicados',
  () => {
    for (const roles of [
      [],
      ['player', 'player'],
    ]) {
      assert.throws(
        () =>
          normalizeUserAdministrationRoles(
            roles,
          ),
        (error) => {
          assert.ok(
            error instanceof
              InvalidUserAdministrationError,
          )
          assert.equal(
            error.issues[0].field,
            'roles',
          )
          return true
        },
      )
    }
  },
)

test('016 roles DTO sólo acepta roles canónicos', () => {
  const userId = randomUUID()

  assert.deepEqual(
    parseUpdateUserRolesRequest(
      userId,
      {
        roles: [
          'narrator',
          'player',
        ],
      },
    ),
    {
      userId,
      roles: [
        'narrator',
        'player',
      ],
    },
  )

  for (const [id, body] of [
    [
      'not-a-uuid',
      { roles: ['player'] },
    ],
    [
      userId,
      { roles: 'player' },
    ],
    [
      userId,
      { roles: ['superadmin'] },
    ],
    [
      userId,
      {
        roles: ['player'],
        permissions: ['anything'],
      },
    ],
  ]) {
    assert.throws(
      () =>
        parseUpdateUserRolesRequest(
          id,
          body,
        ),
      InvalidUserAdministrationRequestError,
    )
  }
})

test(
  '016 roles persiste sólo los roles del usuario existente',
  async () => {
    const current = user()
    const calls = []

    const useCase =
      new UpdateUserRolesUseCase({
        async findById(id) {
          calls.push(['findById', id])
          return current
        },
        async updateRoles(id, roles) {
          calls.push([
            'updateRoles',
            id,
            roles,
          ])
          return {
            ...current,
            roles: [...roles],
          }
        },
      })

    const result =
      await useCase.execute({
        userId: current.id,
        roles: [
          'player',
          'narrator',
        ],
      })

    assert.deepEqual(
      result.roles,
      ['narrator', 'player'],
    )

    assert.deepEqual(calls, [
      ['findById', current.id],
      [
        'updateRoles',
        current.id,
        ['narrator', 'player'],
      ],
    ])
  },
)

test('016 roles devuelve USER_NOT_FOUND semántico', async () => {
  const useCase =
    new UpdateUserRolesUseCase({
      async findById() {
        return null
      },
      async updateRoles() {
        throw new Error('unexpected')
      },
    })

  await assert.rejects(
    useCase.execute({
      userId: randomUUID(),
      roles: ['player'],
    }),
    UserAdministrationUserNotFoundError,
  )
})

test(
  '016 roles publica endpoint separado y no añade permisos individuales',
  () => {
    const controller = readFileSync(
      new URL(
        '../src/users/presentation/user-administration.controller.ts',
        import.meta.url,
      ),
      'utf8',
    )

    const dto = readFileSync(
      new URL(
        '../src/users/presentation/user-administration.dto.ts',
        import.meta.url,
      ),
      'utf8',
    )

    assert.match(
      controller,
      /@Patch\(':userId\/roles'\)/,
    )

    const roleParser =
      dto.match(
        /export function parseUpdateUserRolesRequest[\s\S]*?export function parseResetUserCredentialsRequest/,
      )?.[0] ?? ''

    assert.match(roleParser, /'roles'/)

    assert.doesNotMatch(
      roleParser,
      /permissions|password|status|displayName|username/,
    )
  },
)

test('016 roles mantiene 016-B sin roles en PATCH general', () => {
  const dto = readFileSync(
    new URL(
      '../src/users/presentation/user-administration.dto.ts',
      import.meta.url,
    ),
    'utf8',
  )

  const general =
    dto.match(
      /export function parseUpdateUserAdministrationRequest[\s\S]*?export function parseUpdateUserRolesRequest/,
    )?.[0] ?? ''

  assert.doesNotMatch(
    general,
    /body\.roles|'roles'/,
  )
})
