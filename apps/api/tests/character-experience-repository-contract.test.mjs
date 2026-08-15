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

test('SPEC-053 lectura publica pagina movements y agrega saldos globales', () => {
  const start =
    repository.indexOf(
      '  async loadLedgerPage(',
    )
  const end =
    repository.indexOf(
      '  private async lockCharacter(',
      start,
    )
  const page =
    repository.slice(
      start,
      end,
    )

  assert.match(
    page,
    /characterExperienceMovement\.findMany/,
  )
  assert.match(
    page,
    /skip:\s*query\.offset/,
  )
  assert.match(
    page,
    /take:\s*query\.limit \+ 1/,
  )
  assert.match(
    page,
    /createdAt:\s*'asc'[\s\S]*id:\s*'asc'/,
  )
  assert.match(
    page,
    /characterExperienceMovement\.groupBy/,
  )
  assert.match(
    page,
    /by:\s*\['component'\]/,
  )
  assert.match(
    page,
    /_sum:[\s\S]*amount:\s*true/,
  )
  assert.match(
    page,
    /offsetPageFromRows/,
  )
  assert.match(
    page,
    /available:[\s\S]*total - spent/,
  )
})

test('SPEC-053 loadLedger y transactionLedger permanecen completos', () => {
  const loadStart =
    repository.indexOf(
      '  async loadLedger(',
    )
  const pageStart =
    repository.indexOf(
      '  async loadLedgerPage(',
      loadStart,
    )
  const full =
    repository.slice(
      loadStart,
      pageStart,
    )

  assert.match(
    full,
    /characterExperienceMovement\.findMany/,
  )
  assert.doesNotMatch(
    full,
    /skip:|take:|groupBy/,
  )

  const txStart =
    repository.indexOf(
      '  private async transactionLedger(',
    )
  const txEnd =
    repository.indexOf(
      '  async appendGrant(',
      txStart,
    )
  const transaction =
    repository.slice(
      txStart,
      txEnd,
    )

  assert.match(
    transaction,
    /transaction\.characterExperienceMovement\.findMany/,
  )
  assert.doesNotMatch(
    transaction,
    /skip:|take:|groupBy/,
  )
})
