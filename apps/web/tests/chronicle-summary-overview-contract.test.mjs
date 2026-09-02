import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const detail = readFileSync(
  new URL('../src/features/chronicles/components/ChronicleDetail.tsx', import.meta.url),
  'utf8',
)
const summary = readFileSync(
  new URL('../src/features/chronicles/components/ChronicleSummaryWorkspace.tsx', import.meta.url),
  'utf8',
)
const progressCss = readFileSync(
  new URL('../src/features/chronicles/components/chronicle-summary-progress-containment.css', import.meta.url),
  'utf8',
)

test('Resumen de Crónica reutiliza contexto, participantes y personajes cargados', () => {
  assert.equal(detail.includes('ChronicleSummaryWorkspace'), true)
  for (const value of [
    'participants',
    'characters',
    'chronicle.name',
    'gateway.sessions',
    'storyGateway.list',
    'gateway.events',
  ]) {
    assert.equal(summary.includes(value), true)
  }
})

test('el progreso permanece dentro del carril incluso al 100%', () => {
  assert.match(summary, /chronicle-summary-progress-containment\.css/)
  assert.match(progressCss, /right:\s*8%/)
  assert.match(progressCss, /width:\s*auto/)
  assert.match(
    progressCss,
    /clip-path:\s*inset\([\s\S]*100% - var\(--summary-progress\)/,
  )
})
