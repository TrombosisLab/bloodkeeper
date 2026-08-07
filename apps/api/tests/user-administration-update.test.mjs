import assert from 'node:assert/strict'
import {
  randomUUID,
} from 'node:crypto'
import {
  readFileSync,
} from 'node:fs'
import test from 'node:test'

import {
  UserAlreadyExistsError,
} from '../dist/users/application/create-user.use-case.js'

import {
  UpdateUserUseCase,
  UserAdministrationUserNotFoundError,
} from '../dist/users/application/update-user.use-case.js'

import {
  InvalidUserAdministrationError,
  normalizeUserAdministrationUpdate,
} from '../dist/users/domain/user-administration.rules.js'

import {
  InvalidUserAdministrationRequestError,
  parseUpdateUserAdministrationRequest,
} from '../dist/users/presentation/user-administration.dto.js'

function user(overrides = {}) {
  return {
    id: randomUUID(),
    username: 'player-one',
    displayName: 'Player One',
    status: 'active',
    roles: ['player'],
    createdAt:
      new Date('2026-08-07T10:00:00Z'),
    updatedAt:
      new Date('2026-08-07T10:00:00Z'),
    ...overrides,
  }
}

test(
  '016-B normaliza username displayName y estado editable',
  () => {
    assert.deepEqual(
      normalizeUserAdministrationUpdate({
        username: '  Player.Two  ',
        displayName: '  Player Two  ',
        status: 'disabled',
      }),
      {
        username: 'player.two',
        displayName: 'Player Two',
        status: 'disabled',
      },
    )
  },
)

test(
  '016-B rechaza identidad o estado inválidos',
  () => {
    assert.throws(
      () =>
        normalizeUserAdministrationUpdate({
          username: 'NO VÁLIDO',
          displayName: '',
          status: 'blocked',
        }),
      (error) => {
        assert.ok(
          error instanceof
            InvalidUserAdministrationError,
        )

        const fields =
          error.issues.map(
            (issue) => issue.field,
          )

        assert.ok(
          fields.includes('username'),
        )
        assert.ok(
          fields.includes('displayName'),
        )
        assert.ok(
          fields.includes('status'),
        )

        return true
      },
    )
  },
)

test(
  '016-B DTO admite sólo campos editables y exige al menos uno',
  () => {
    const userId = randomUUID()

    assert.deepEqual(
      parseUpdateUserAdministrationRequest(
        userId,
        {
          username: 'NEW.USER',
          status: 'disabled',
        },
      ),
      {
        userId,
        username: 'NEW.USER',
        status: 'disabled',
      },
    )

    for (const body of [
      {},
      {
        roles: ['admin'],
      },
      {
        password: 'forbidden',
      },
      {
        status: 'blocked',
      },
    ]) {
      assert.throws(
        () =>
          parseUpdateUserAdministrationRequest(
            userId,
            body,
          ),
        InvalidUserAdministrationRequestError,
      )
    }

    assert.throws(
      () =>
        parseUpdateUserAdministrationRequest(
          'not-a-uuid',
          {
            status: 'active',
          },
        ),
      InvalidUserAdministrationRequestError,
    )
  },
)

test(
  '016-B actualiza y revoca sesiones al desactivar',
  async () => {
    const current = user()
    const calls = []

    const users = {
      async findById(userId) {
        calls.push(['findById', userId])
        return current
      },
      async findByUsername(username) {
        calls.push([
          'findByUsername',
          username,
        ])
        return null
      },
      async update(userId, data) {
        calls.push([
          'update',
          userId,
          data,
        ])

        return user({
          ...current,
          ...data,
          updatedAt:
            new Date(
              '2026-08-07T11:00:00Z',
            ),
        })
      },
    }

    const revokedAt =
      new Date('2026-08-07T12:00:00Z')

    const sessions = {
      async revokeAllByUserId(
        userId,
        when,
      ) {
        calls.push([
          'revokeAllByUserId',
          userId,
          when,
        ])
        return 2
      },
    }

    const useCase =
      new UpdateUserUseCase(
        users,
        sessions,
        () => revokedAt,
      )

    const result =
      await useCase.execute({
        userId: current.id,
        username: '  PLAYER.TWO  ',
        displayName: '  Player Two  ',
        status: 'disabled',
      })

    assert.equal(
      result.username,
      'player.two',
    )
    assert.equal(
      result.displayName,
      'Player Two',
    )
    assert.equal(
      result.status,
      'disabled',
    )
    assert.deepEqual(
      result.roles,
      ['player'],
    )

    assert.deepEqual(
      calls.at(-1),
      [
        'revokeAllByUserId',
        current.id,
        revokedAt,
      ],
    )
  },
)

test(
  '016-B modela ausencia y username duplicado',
  async () => {
    const sessions = {
      async revokeAllByUserId() {
        throw new Error('unexpected')
      },
    }

    await assert.rejects(
      () =>
        new UpdateUserUseCase(
          {
            async findById() {
              return null
            },
          },
          sessions,
        ).execute({
          userId: randomUUID(),
          status: 'disabled',
        }),
      UserAdministrationUserNotFoundError,
    )

    const current = user()

    await assert.rejects(
      () =>
        new UpdateUserUseCase(
          {
            async findById() {
              return current
            },
            async findByUsername() {
              return user({
                id: randomUUID(),
                username: 'occupied',
              })
            },
          },
          sessions,
        ).execute({
          userId: current.id,
          username: 'occupied',
        }),
      UserAlreadyExistsError,
    )
  },
)

test(
  '016-B registra PATCH y reutiliza sesiones auth sin UI ni roles',
  () => {
    const controller =
      readFileSync(
        new URL(
          '../src/users/presentation/user-administration.controller.ts',
          import.meta.url,
        ),
        'utf8',
      )

    const module =
      readFileSync(
        new URL(
          '../src/users/users.module.ts',
          import.meta.url,
        ),
        'utf8',
      )

    const dto =
      readFileSync(
        new URL(
          '../src/users/presentation/user-administration.dto.ts',
          import.meta.url,
        ),
        'utf8',
      )

    assert.match(
      controller,
      /@Patch\(':userId'\)/,
    )
    assert.match(
      module,
      /PrismaAuthSessionRepository/,
    )
    assert.match(
      module,
      /UpdateUserUseCase/,
    )

    const updateBlock =
      dto.match(
        /parseUpdateUserAdministrationRequest[\s\S]*?export function toUserAdministrationResponse/,
      )?.[0] ?? ''

    assert.match(
      updateBlock,
      /username/,
    )
    assert.match(
      updateBlock,
      /displayName/,
    )
    assert.match(
      updateBlock,
      /status/,
    )
    assert.doesNotMatch(
      updateBlock.match(
        /onlyKeys\([\s\S]*?\)/,
      )?.[0] ?? '',
      /roles|password/,
    )
  },
)
