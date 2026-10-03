import assert from 'node:assert/strict'
import test from 'node:test'
import 'reflect-metadata'
import { GlobalHistoryController } from '../dist/history/presentation/global-history.controller.js'
import { validateReferences, resourceWhere, characterWhere } from '../dist/history/presentation/history-reference-access.js'

const userId = '10000000-0000-4000-8000-000000000001'
const entryId = '20000000-0000-4000-8000-000000000001'
const ref = { key: 'resource:30000000-0000-4000-8000-000000000001', type: 'resource', id: '30000000-0000-4000-8000-000000000001', label: 'Un nombre publicado' }
const player = { user: { id: userId, roles: ['player'] } }

test('una ficha denegada conserva el nombre publicado sin devolver datos de la ficha', async () => {
  let query
  const db = { globalHistoryEntry: { findFirst: async input => { query = input; return { references: [ref] } } }, libraryResource: { findFirst: async () => null } }
  const controller = new GlobalHistoryController(db)
  await assert.rejects(() => controller.reference(player, entryId, ref.key), error => error.getStatus() === 403 && error.getResponse().code === 'HISTORY_REFERENCE_UNKNOWN')
  assert.equal(query.where.visibility, 'ALL_USERS')
  assert.equal(query.where.status, 'PUBLISHED')
})

test('una clave ajena a la entrada no sirve para explorar otras fichas', async () => {
  let queried = false
  const db = { globalHistoryEntry: { findFirst: async () => ({ references: [ref] }) }, libraryResource: { findFirst: async () => { queried = true } } }
  await assert.rejects(() => new GlobalHistoryController(db).reference(player, entryId, 'resource:otro'), error => error.getStatus() === 404)
  assert.equal(queried, false)
})

test('la imagen de una entrada inaccesible no llega a consultarse', async () => {
  let queried = false
  const db = { globalHistoryEntry: { findFirst: async () => null }, globalHistoryImage: { findUnique: async () => { queried = true } } }
  await assert.rejects(() => new GlobalHistoryController(db).image(player, entryId), error => error.getStatus() === 404)
  assert.equal(queried, false)
})

test('la ficha compartida no incluye notas del narrador ni metadatos privados', async () => {
  let selection
  const db = { globalHistoryEntry: { findFirst: async () => ({ references: [ref] }) }, libraryResource: { findFirst: async input => { selection = input.select; return { name: 'Nombre', summary: 'Descripción compartida', kind: 'npc' } } } }
  const result = await new GlobalHistoryController(db).reference(player, entryId, ref.key)
  assert.deepEqual(selection, { name: true, summary: true, kind: true })
  assert.deepEqual(result, { label: 'Nombre', category: 'npc', description: 'Descripción compartida' })
})

test('el servidor rechaza imágenes superiores a 5 MiB y formatos falsificados', async () => {
  let saved = false
  const db = { globalHistoryEntry: { findUnique: async () => ({ authorId: userId, visibility: 'ALL_USERS' }) }, globalHistoryImage: { upsert: async () => { saved = true } } }
  const controller = new GlobalHistoryController(db)
  const request = bytes => ({ user: { id: userId, roles: ['admin'] }, headers: { 'content-type': 'image/png' }, async *[Symbol.asyncIterator]() { yield bytes } })
  await assert.rejects(() => controller.uploadImage(request(Buffer.alloc(5 * 1024 * 1024 + 1)), entryId), error => error.getStatus() === 413)
  await assert.rejects(() => controller.uploadImage(request(Buffer.from('not a png')), entryId), error => error.getStatus() === 400)
  assert.equal(saved, false)
})

test('guardar menciones valida el catálogo y no acepta etiquetas falsificadas', async () => {
  const db = { libraryResource: { findMany: async () => [{ id: ref.id, name: 'Nombre real', kind: 'npc' }] }, character: { findMany: async () => [] }, chronicleNpc: { findMany: async () => [] }, chronicleLocation: { findMany: async () => [] } }
  const actor = { userId, admin: false, narrator: true }
  assert.equal((await validateReferences(db, actor, [{ ...ref, label: 'Falso' }]))[0].label, 'Nombre real')
  await assert.rejects(() => validateReferences(db, actor, [{ key: 'resource:inexistente' }]))
  assert.match(JSON.stringify(resourceWhere(actor)), /selected_players/)
  assert.match(JSON.stringify(resourceWhere(actor)), /ACTIVE/)
  assert.match(JSON.stringify(characterWhere(actor)), /NARRATOR/)
})
