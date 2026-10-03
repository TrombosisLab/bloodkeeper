import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const schema = fs.readFileSync(
  new URL('../prisma/schema.prisma', import.meta.url),
  'utf8',
)
const migration = fs.readFileSync(
  new URL(
    '../prisma/migrations/20261003120000_add_global_history/migration.sql',
    import.meta.url,
  ),
  'utf8',
)
const controller = fs.readFileSync(
  new URL(
    '../src/history/presentation/global-history.controller.ts',
    import.meta.url,
  ),
  'utf8',
)
const appModule = fs.readFileSync(
  new URL('../src/app.module.ts', import.meta.url),
  'utf8',
)

test('la historia global tiene entradas propias y vínculos opcionales con crónicas', () => {
  assert.match(schema, /model GlobalHistoryEntry\s*\{/)
  assert.match(schema, /model GlobalHistoryEntryChronicle\s*\{/)
  assert.match(schema, /status\s+GlobalHistoryEntryStatus\s+@default\(DRAFT\)/)
  assert.match(schema, /visibility\s+GlobalHistoryEntryVisibility\s+@default\(ALL_USERS\)/)
  assert.match(migration, /CREATE TABLE "global_history_entries"/)
  assert.match(migration, /CREATE TABLE "global_history_entry_chronicles"/)
})

test('los jugadores solo reciben historia publicada y compartida', () => {
  assert.match(controller, /@Controller\('history'\)/)
  assert.match(controller, /status: 'PUBLISHED'/)
  assert.match(controller, /visibility: 'ALL_USERS'/)
  assert.match(controller, /canManage: actor\.narrator/)
  assert.match(controller, /GLOBAL_HISTORY_PERMISSION_DENIED/)
})

test('el módulo de historia está conectado a la aplicación', () => {
  assert.match(appModule, /import \{ HistoryModule \}/)
  assert.match(appModule, /HistoryModule,/)
})
