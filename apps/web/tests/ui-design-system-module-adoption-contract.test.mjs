import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const designSystem = await readFile(
  new URL('../src/styles/design-system.css', import.meta.url),
  'utf8',
)
const authentication = await readFile(
  new URL(
    '../src/features/authentication/components/authentication-gate.css',
    import.meta.url,
  ),
  'utf8',
)
const chronicles = await readFile(
  new URL(
    '../src/features/chronicles/components/chronicle-list-create.css',
    import.meta.url,
  ),
  'utf8',
)

test('SPEC-010.C.1 define tokens reutilizables y no específicos', () => {
  for (const token of [
    '--color-accent-glow:',
    '--color-surface-translucent:',
    '--color-surface-control:',
    '--color-surface-card:',
    '--radius-control:',
    '--radius-pill:',
    '--shadow-raised:',
    '--shadow-floating:',
    '--shadow-overlay:',
  ]) {
    assert.match(designSystem, new RegExp(token))
  }

  assert.doesNotMatch(designSystem, /--(?:authentication|chronicle)-/)
})

test('SPEC-010.C.1 unifica autenticación sin perder responsive', () => {
  assert.match(authentication, /var\(--color-canvas\)/)
  assert.match(authentication, /var\(--color-focus\)/)
  assert.match(authentication, /var\(--radius-control\)/)
  assert.match(authentication, /var\(--shadow-floating\)/)
  assert.doesNotMatch(authentication, /#[0-9a-f]{3,8}\b/i)
  assert.doesNotMatch(authentication, /rgba?\(/)
  assert.match(authentication, /@media \(max-width: 40rem\)/)
})

test('SPEC-010.C.1 unifica crónicas sin perder responsive', () => {
  assert.match(chronicles, /var\(--color-surface-translucent\)/)
  assert.match(chronicles, /var\(--color-border-accent\)/)
  assert.match(chronicles, /var\(--radius-pill\)/)
  assert.match(chronicles, /var\(--shadow-raised\)/)
  assert.doesNotMatch(chronicles, /#[0-9a-f]{3,8}\b/i)
  assert.doesNotMatch(chronicles, /rgba?\(/)
  assert.match(chronicles, /@media \(max-width: 760px\)/)
})
