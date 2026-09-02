import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const schema = await readFile(new URL('../prisma/schema.prisma', import.meta.url), 'utf8')
const controller = await readFile(new URL('../src/chronicles/presentation/chronicle-session-participant-notes.controller.ts', import.meta.url), 'utf8')
const moduleSource = await readFile(new URL('../src/chronicles/chronicles.module.ts', import.meta.url), 'utf8')

test('las notas de juego se persisten por sesión y autor', () => {
  assert.match(schema, /model ChronicleSessionParticipantNote/)
  assert.match(schema, /@@unique\(\[sessionId, authorUserId\]\)/)
  assert.match(controller, /participant-notes/)
  assert.match(controller, /privateNotes/)
  assert.match(controller, /publicNotes/)
  assert.match(controller, /revision: \{ increment: 1 \}/)
})

test('solo participantes activos acceden y las notas públicas se comparten', () => {
  assert.match(controller, /findActiveMembership/)
  assert.match(controller, /CHRONICLE_SESSION_NOTE_PERMISSION_DENIED/)
  assert.match(controller, /sharedNotes/)
  assert.match(controller, /authorName/)
  assert.match(moduleSource, /ChronicleSessionParticipantNotesController/)
})
