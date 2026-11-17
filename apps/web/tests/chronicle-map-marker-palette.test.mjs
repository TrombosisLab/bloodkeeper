import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync(new URL('../src/features/map/components/chronicle-map.css', import.meta.url), 'utf8')
const page = fs.readFileSync(new URL('../src/features/map/components/ChronicleMapPage.tsx', import.meta.url), 'utf8')

test('los marcadores se distinguen por color y silueta', () => {
  assert.match(css, /\.chronicle-map-marker--location \{ background: #3979b7; \}/i)
  assert.match(css, /\.chronicle-map-marker--refuge \{[^}]*background: #2f8a57;[^}]*clip-path: polygon\(/i)
  assert.match(css, /\.chronicle-map-marker--landmark \{[^}]*background: #d6a72c;[^}]*clip-path: polygon\(/i)
  assert.match(css, /\.chronicle-map-marker--danger \{[^}]*background: #782d38;[^}]*clip-path: polygon\(/i)
  assert.match(page, /marker\.kind === 'REFUGE' \? ''/)
  assert.match(page, /marker\.kind === 'LANDMARK' \? ''/)
  assert.match(page, /marker\.kind === 'DANGER' \? '!'/)
})

test('se conservan los tres tamaños configurables', () => {
  assert.match(css, /\.chronicle-map-marker--size-small \{[^}]*width: \.52rem/)
  assert.match(css, /\.chronicle-map-marker--size-medium \{[^}]*width: \.78rem/)
  assert.match(css, /\.chronicle-map-marker--size-large \{[^}]*width: 1\.55rem/)
})
