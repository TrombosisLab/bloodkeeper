import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const schema = readFileSync(new URL('../prisma/schema.prisma', import.meta.url), 'utf8')
const context = readFileSync(new URL('../src/chronicles/application/load-chronicle-session-context.use-case.ts', import.meta.url), 'utf8')
const workspace = readFileSync(new URL('../src/chronicles/application/load-chronicle-session-workspace.use-case.ts', import.meta.url), 'utf8')
const projection = readFileSync(new URL('../src/chronicles/presentation/chronicle-story.dto.ts', import.meta.url), 'utf8')

test('SPEC-069 persiste visibilidad y vínculos de recursos con sesiones', () => {
  assert.match(schema, /visibility\s+String\s+@default\("narrator_only"\)/)
  assert.match(schema, /model ChronicleSessionResource/)
  assert.match(schema, /resourceLinks\s+ChronicleSessionResource\[\]/)
})

test('SPEC-069 filtra recursos privados para jugadores', () => {
  assert.match(context, /membership\.role === 'narrator'/)
  assert.match(context, /resource\.visibility === 'chronicle_participants'/)
})

test('SPEC-069 muestra sólo la escena operativa al jugador y conserva preparación privada', () => {
  assert.match(workspace, /scenes\.find\(\(scene\) => scene\.status === ChronicleSessionWorkStatus\.PENDING\)/)
  assert.match(workspace, /preparationItems: membership\.role === 'narrator'/)
})

test('SPEC-069 proyección compartida identifica sesiones de la historia', () => {
  assert.match(projection, /sessionIds: story\.sessions\.map\(\(session\) => session\.id\)/)
})
