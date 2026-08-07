import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const root =
  new URL('../', import.meta.url)

async function source(path) {
  return readFile(
    new URL(path, root),
    'utf8',
  )
}

test(
  '015-C expone una herramienta administrativa local y no un endpoint HTTP',
  async () => {
    const packageJson =
      JSON.parse(
        await source('package.json'),
      )
    const tool =
      await source(
        'src/auth/tools/reset-user-password.ts',
      )
    const controller =
      await source(
        'src/auth/presentation/auth.controller.ts',
      )

    assert.match(
      packageJson.scripts[
        'admin:reset-password'
      ],
      /reset-user-password/,
    )
    assert.match(
      tool,
      /ResetUserPasswordUseCase/,
    )
    assert.doesNotMatch(
      controller,
      /reset-user-password|resetPassword|password-reset/i,
    )
  },
)

test(
  '015-C usa variables administrativas de recuperación dedicadas',
  async () => {
    const tool =
      await source(
        'src/auth/tools/reset-user-password.ts',
      )

    assert.match(
      tool,
      /RECOVERY_USERNAME/,
    )
    assert.match(
      tool,
      /RECOVERY_PASSWORD/,
    )
    assert.doesNotMatch(
      tool,
      /ADMIN_DISPLAY_NAME|ADMIN_PASSWORD/,
    )
  },
)

test(
  '015-C limita la persistencia a passwordHash y revoca sesiones de la cuenta',
  async () => {
    const users =
      await source(
        'src/auth/infrastructure/prisma-auth-user.repository.ts',
      )
    const sessions =
      await source(
        'src/auth/infrastructure/prisma-auth-session.repository.ts',
      )

    assert.match(
      users,
      /updatePasswordHash/,
    )
    assert.match(
      users,
      /data:\s*\{\s*passwordHash,\s*\}/,
    )

    assert.match(
      sessions,
      /revokeAllByUserId/,
    )
    assert.match(
      sessions,
      /userId,\s*revokedAt: null/,
    )
  },
)

test(
  '015-C no adelanta gestión general de usuarios ni interfaz administrativa',
  async () => {
    const tool =
      await source(
        'src/auth/tools/reset-user-password.ts',
      )
    const useCase =
      await source(
        'src/auth/application/reset-user-password.use-case.ts',
      )

    for (const text of [
      tool,
      useCase,
    ]) {
      assert.doesNotMatch(
        text,
        /displayName\s*:|roles\s*:|status\s*:|createUser|listUsers|disableUser|enableUser/,
      )
    }
  },
)
