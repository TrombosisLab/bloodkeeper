import assert from 'node:assert/strict'
import {
  readFileSync,
} from 'node:fs'
import test from 'node:test'

const schema = readFileSync(
  new URL('../prisma/schema.prisma', import.meta.url),
  'utf8',
)

const migration = readFileSync(
  new URL(
    '../prisma/migrations/' +
      '20260804200500_add_authentication_foundation/' +
      'migration.sql',
    import.meta.url,
  ),
  'utf8',
)

function block(source, pattern) {
  const start = source.search(pattern)

  assert.notEqual(start, -1)

  const remaining = source.slice(start)
  const end = remaining.indexOf('\n}')

  assert.notEqual(end, -1)

  return remaining.slice(0, end + 2)
}

test(
  '015-A modela usuarios activos o desactivados con roles',
  () => {
    const user = block(
      schema,
      /model User\s*\{/,
    )

    assert.match(
      schema,
      /enum UserAccountStatus\s*\{[\s\S]*ACTIVE[\s\S]*DISABLED/,
    )
    assert.match(
      schema,
      /enum UserRole\s*\{[\s\S]*ADMIN[\s\S]*NARRATOR[\s\S]*PLAYER/,
    )
    assert.match(
      user,
      /username\s+String\s+@unique/,
    )
    assert.match(
      user,
      /passwordHash\s+String/,
    )
    assert.match(
      user,
      /roles\s+UserRole\[\]\s+@default\(\[PLAYER\]\)/,
    )
    assert.doesNotMatch(
      user,
      /password\s+String/,
    )
  },
)

test(
  '015-A almacena únicamente el hash del token de sesión',
  () => {
    const session = block(
      schema,
      /model AuthSession\s*\{/,
    )

    assert.match(
      session,
      /tokenHash\s+String\s+@unique/,
    )
    assert.match(
      session,
      /expiresAt\s+DateTime/,
    )
    assert.match(
      session,
      /revokedAt\s+DateTime\?/,
    )
    assert.doesNotMatch(
      session,
      /^\s*token\s+String/m,
    )
  },
)

test(
  '015-A usa migración aditiva con integridad y cascada de sesiones',
  () => {
    assert.match(
      migration,
      /CREATE TABLE "users"/,
    )
    assert.match(
      migration,
      /CREATE TABLE "auth_sessions"/,
    )
    assert.match(
      migration,
      /auth_sessions_tokenHash_key/,
    )
    assert.match(
      migration,
      /REFERENCES "users"\("id"\)[\s\S]*ON DELETE CASCADE/,
    )
    assert.match(
      migration,
      /users_roles_not_empty/,
    )
  },
)
