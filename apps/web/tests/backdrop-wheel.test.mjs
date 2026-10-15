import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('wheel cancellation is local, non-passive and cleaned up on canvas unmount', () => {
  const source = readFileSync(new URL('../src/features/chronicles/components/ChronicleBackdropWorkspace.tsx', import.meta.url), 'utf8')
  assert.match(source, /element\.addEventListener\('wheel', wheel, \{ passive: false \}\)/)
  assert.match(source, /element\.removeEventListener\('wheel', wheel\)/)
  assert.match(source, /event\.preventDefault\(\)/)
  assert.match(source, /event\.stopPropagation\(\)/)
  assert.doesNotMatch(source, /onWheel=/)
  assert.doesNotMatch(source, /(?:document|window)\.addEventListener\('wheel'/)
})
