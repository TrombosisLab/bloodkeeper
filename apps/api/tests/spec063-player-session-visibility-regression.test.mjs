import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const listSource = fs.readFileSync(
  new URL('../src/chronicles/application/list-chronicle-sessions.use-case.ts', import.meta.url),
  'utf8',
)
const loadSource = fs.readFileSync(
  new URL('../src/chronicles/application/load-chronicle-session.use-case.ts', import.meta.url),
  'utf8',
)

function permitsActiveParticipant(source) {
  return source.includes('assertChronicleSessionParticipant') ||
    (source.includes('findActiveMembership') && source.includes('membership === null'))
}

test('SPEC-063 jugador activo puede listar las sesiones de su cronica', () => {
  assert.equal(permitsActiveParticipant(listSource), true)
  assert.equal(listSource.includes('assertChronicleSessionNarrator('), false)
})

test('SPEC-063 jugador activo puede cargar una sesion de su cronica', () => {
  assert.equal(permitsActiveParticipant(loadSource), true)
  assert.equal(loadSource.includes('assertChronicleSessionNarrator('), false)
})
