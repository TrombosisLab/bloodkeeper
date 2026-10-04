import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import test from 'node:test'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const read = (path) => readFileSync(resolve(root, path), 'utf8')

test('story guide offers a private connected-card canvas and explicit save', () => {
  const ui = read('src/features/chronicles/components/ChronicleStoryGuideWorkspace.tsx')
  assert.match(ui, /Guion privado del Narrador/)
  assert.match(ui, /Arrastra las tarjetas para ordenar el flujo/)
  assert.match(ui, /Crear conexión/)
  assert.match(ui, /Añadir flecha/)
  assert.match(ui, /Guardar guion/)
  assert.match(ui, /No se publica ni se copia automáticamente/)
  assert.match(ui, /onPointerMove/)
})

test('narrator guide persists through revisioned story updates', () => {
  const workspace = read('src/features/chronicles/components/ChronicleStoryWorkspace.tsx')
  const types = read('src/features/chronicles/types/chronicle-story-api.types.ts')
  assert.match(workspace, /narratorGuide: guide/)
  assert.match(workspace, /expectedRevision: selected\.revision/)
  assert.match(types, /narratorGuide\?: ChronicleStoryGuide/)
})

test('participant story projection never serializes the private graph', () => {
  const dto = read('../api/src/chronicles/presentation/chronicle-story.dto.ts')
  const sharedProjection = dto.slice(dto.indexOf('export function toSharedChronicleStoryResponse'))
  assert.match(dto, /narratorGuide: story\.narratorGuide/)
  assert.doesNotMatch(sharedProjection, /narratorGuide/)
})

test('backend validates graph size and requires valid connection endpoints', () => {
  const dto = read('../api/src/chronicles/presentation/chronicle-story.dto.ts')
  assert.match(dto, /guide\.cards\.length > 120/)
  assert.match(dto, /guide\.connections\.length > 240/)
  assert.match(dto, /!ids\.has\(from\) \|\| !ids\.has\(to\) \|\| from === to/)
})
