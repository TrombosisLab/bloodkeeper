import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const schema = fs.readFileSync(new URL('../prisma/schema.prisma', import.meta.url), 'utf8')
const portrait = fs.readFileSync(new URL('../src/characters/presentation/character-portrait.controller.ts', import.meta.url), 'utf8')
const storage = fs.readFileSync(new URL('../src/administration/storage-usage.controller.ts', import.meta.url), 'utf8')

test('SPEC-067 persiste un único retrato limitado por personaje', () => {
  assert.match(schema, /model CharacterPortrait/)
  assert.match(schema, /data\s+Bytes/)
  assert.match(portrait, /MAX_PORTRAIT_BYTES = 2 \* 1024 \* 1024/)
  assert.match(portrait, /image\/jpeg/)
  assert.match(portrait, /image\/png/)
  assert.match(portrait, /image\/webp/)
})

test('SPEC-067 expone almacenamiento persistente sólo a administración', () => {
  assert.match(storage, /@Get\('storage'\)/)
  assert.match(storage, /roles\.includes\('admin'\)/)
  assert.match(storage, /pg_database_size/)
  assert.match(storage, /totalBytes: databaseBytes \+ backups\.bytes/)
})
