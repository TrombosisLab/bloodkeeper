import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const designSystem = await readFile(
  new URL('../src/styles/design-system.css', import.meta.url),
  'utf8',
)
const creationStyles = await readFile(
  new URL('../src/styles/character-creation.css', import.meta.url),
  'utf8',
)

const attributesMarker = [
  '/* ==================================================',
  '   MILESTONE-003 / 003-C — ATRIBUTOS INTERACTIVOS',
].join('\n')
const [creationShell, attributesAndLater] = creationStyles.split(
  attributesMarker,
)

test('SPEC-010.C.2A limita la migración al shell e Identidad', () => {
  assert.equal(typeof creationShell, 'string')
  assert.equal(typeof attributesAndLater, 'string')

  const shellHash = createHash('sha256')
    .update(creationShell)
    .digest('hex')

  assert.equal(
    shellHash,
    '8a5d36eb12bd7db670c1ee50832adbf6d061920cd752dc42b6a76d4d7b6481c6',
  )
})

test('SPEC-010.C.2A elimina colores literales del bloque migrado', () => {
  assert.doesNotMatch(creationShell, /#[0-9a-f]{3,8}\b/i)
  assert.doesNotMatch(
    creationShell,
    /(?:rgb|rgba|hsl|hsla)\([^)]*\)/i,
  )

  for (const token of [
    'var(--color-surface)',
    'var(--color-text-primary)',
    'var(--color-border-default)',
    'var(--color-accent)',
    'var(--color-focus-soft)',
  ]) {
    assert.match(creationShell, new RegExp(
      token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    ))
  }
})

test('SPEC-010.C.2A adopta tipografía forma y ritmo comunes', () => {
  assert.match(creationShell, /var\(--font-family-heading\)/)
  assert.match(creationShell, /var\(--font-size-xs\)/)
  assert.match(creationShell, /var\(--radius-sm\)/)
  assert.match(creationShell, /var\(--transition-fast\)/)
  assert.match(creationShell, /var\(--space-[1-7]\)/)
  assert.match(creationShell, /var\(--content-max-width\)/)
})

test('SPEC-010.C.2A conserva estructura y responsive existentes', () => {
  for (const selector of [
    '.creation-layout',
    '.creation-progress__step--active',
    '.creation-actions',
    '.creation-form-grid',
    '.creation-field input',
  ]) {
    assert.equal(creationShell.includes(selector), true)
  }

  assert.match(creationShell, /@media \(max-width: 820px\)/)
  assert.match(creationShell, /@media \(max-width: 600px\)/)
  assert.match(creationShell, /@media \(max-width: 720px\)/)
})

test('SPEC-010.C.2A añade únicamente tokens reutilizables', () => {
  for (const token of [
    '--color-surface-hover:',
    '--color-surface-hover-subtle:',
    '--color-surface-inset-subtle:',
    '--color-accent-active:',
    '--color-accent-tint:',
    '--color-focus-soft:',
  ]) {
    assert.match(designSystem, new RegExp(token))
  }

  assert.doesNotMatch(designSystem, /--(?:creation|identity)-/)
})
