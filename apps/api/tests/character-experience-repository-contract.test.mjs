import assert from 'node:assert/strict'
import {
  readFileSync,
} from 'node:fs'
import test from 'node:test'

const repository = readFileSync(
  new URL(
    '../src/characters/infrastructure/prisma-character-experience.repository.ts',
    import.meta.url,
  ),
  'utf8',
)

test('056-B deriva total gastada y disponible desde movimientos', () => {
  assert.match(repository, /function toLedger/)
  assert.match(repository, /component === 'earned'/)
  assert.match(repository, /component === 'spent'/)
  assert.match(repository, /available: total - spent/)
  assert.doesNotMatch(
    repository,
    /character\.(?:update|updateMany)[\s\S]*(?:experienceTotal|experienceSpent|experienceAvailable)/,
  )
})

test('056-B serializa escrituras por personaje y conserva append-only', () => {
  assert.match(repository, /FOR UPDATE/)
  assert.match(repository, /\$transaction/)
  assert.match(repository, /characterExperienceMovement\.create/)
  assert.doesNotMatch(
    repository,
    /characterExperienceMovement\.(?:update|updateMany|delete|deleteMany)/,
  )
})

test('056-B revalida cronica sesion y saldo dentro de transaccion', () => {
  assert.match(repository, /current\.chronicleId !== chronicleId/)
  assert.match(
    repository,
    /PrismaChronicleSessionStatus\.COMPLETED/,
  )
  assert.match(
    repository,
    /PrismaChronicleSessionStatus\.ARCHIVED/,
  )
  assert.match(
    repository,
    /projectCharacterExperienceCorrection/,
  )
})

test('056-B traduce unicidad a movimiento duplicado', () => {
  assert.match(repository, /error\.code === 'P2002'/)
  assert.match(
    repository,
    /CharacterExperienceDuplicateError/,
  )
})
