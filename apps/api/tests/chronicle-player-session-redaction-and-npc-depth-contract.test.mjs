import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = (path) => readFile(new URL(`../src/chronicles/${path}`, import.meta.url), 'utf8')

const [listSessions, loadSession, npcTypes, npcDto] = await Promise.all([
  source('application/list-chronicle-sessions.use-case.ts'),
  source('application/load-chronicle-session.use-case.ts'),
  source('domain/chronicle-npc.types.ts'),
  source('presentation/chronicle-npc.dto.ts'),
])

test('las sesiones exigen membresía activa y ocultan notas privadas a jugadores', () => {
  for (const implementation of [listSessions, loadSession]) {
    assert.match(implementation, /findActiveMembership/)
    assert.match(implementation, /ChronicleSessionPermissionError/)
    assert.match(implementation, /membership\.role === 'narrator'/)
    assert.match(implementation, /narratorNotes: null/)
  }
})

test('el perfil profundo de PNJ conserva datos heredados y añade estructura V5', () => {
  assert.match(npcTypes, /interface ChronicleNpcAttributes/)
  assert.match(npcTypes, /interface ChronicleNpcDiscipline/)
  assert.match(npcTypes, /disciplineDetails/)
  assert.match(npcDto, /profileAttributes/)
  assert.match(npcDto, /profileDisciplines/)
  assert.match(npcDto, /disciplineDetails\.map\(entry=>entry\.name\)/)
})

test('las listas del dossier se normalizan y eliminan duplicados', () => {
  assert.match(npcDto, /toLocaleLowerCase\('es'\)/)
  assert.match(npcDto, /new Map/)
})
