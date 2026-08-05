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

const separator = '/* =================================================='
const powersMarker = [
  '/* ==================================================',
  '   MILESTONE-003 / 003-G PARTE 5C — PODERES',
].join('\n')

const powersStart = creationStyles.indexOf(powersMarker)
const nextBoundary = creationStyles.indexOf(
  separator,
  powersStart + powersMarker.length,
)

assert.notEqual(powersStart, -1)
assert.notEqual(nextBoundary, -1)

const powersBlock = creationStyles.slice(
  powersStart,
  nextBoundary,
)
const laterStyles = creationStyles.slice(nextBoundary)

test('SPEC-010.C.2H limita la migración al bloque Poderes', () => {
  const suffixHash = createHash('sha256')
    .update(laterStyles)
    .digest('hex')

  assert.equal(
    suffixHash,
    'a58c0ee11458e21cdc47a71e4684393b63065d0905e7ba400a36f8ed88bdb180',
  )
  assert.equal(
    laterStyles.includes(
      '6B.12 — RITUAL INICIAL DE HECHICERÍA',
    ),
    true,
  )
})

test('SPEC-010.C.2H elimina colores literales de Poderes', () => {
  assert.doesNotMatch(
    powersBlock,
    /#[0-9a-f]{3,8}\b/i,
  )
  assert.doesNotMatch(
    powersBlock,
    /(?:rgb|rgba|hsl|hsla)\([^)]*\)/i,
  )
})

test('SPEC-010.C.2H adopta tokens visuales compartidos', () => {
  for (const token of [
    "var(--color-accent-label-muted)",
    "var(--color-accent-state)",
    "var(--color-accent-value-strong)",
    "var(--color-border-section-subtle)",
    "var(--color-danger-muted)",
    "var(--color-group-border-soft)",
    "var(--color-option-border-muted)",
    "var(--color-option-hover-border)",
    "var(--color-selected-border-emphasis)",
    "var(--color-selected-surface-emphasis)",
    "var(--color-success-muted)",
    "var(--color-surface)",
    "var(--color-surface-inset-subtle)",
    "var(--color-text-caption-muted)",
    "var(--color-text-option)",
    "var(--color-text-option-subtle)",
    "var(--color-text-overline-muted)",
    "var(--color-text-state-muted)",
    "var(--color-text-title-soft)",
    "var(--font-family-heading)"
]) {
    assert.equal(
      powersBlock.includes(token),
      true,
      `Falta ${token} en Poderes`,
    )
  }
})

test('SPEC-010.C.2H conserva estructura estados y responsive', () => {
  for (const selector of [
    ".discipline-power-selectors",
    ".discipline-power-selector",
    ".discipline-power-selector__header",
    ".discipline-power-selector__help",
    ".discipline-power-selector__options",
    ".discipline-power-option",
    ".discipline-power-option:hover:not(:disabled)",
    ".discipline-power-option--selected",
    ".discipline-power-option:disabled",
    ".discipline-power-option__level",
    ".discipline-power-option__state",
    ".discipline-power-selector__validation",
    ".discipline-power-selector__validation--valid"
]) {
    assert.equal(
      powersBlock.includes(selector),
      true,
      `Falta ${selector}`,
    )
  }

  for (const mediaQuery of [
    "@media (max-width: 850px)"
]) {
    assert.equal(
      powersBlock.includes(mediaQuery),
      true,
      `Falta ${mediaQuery}`,
    )
  }

  assert.match(powersBlock, /min-height:\s*94px/)
  assert.match(powersBlock, /opacity:\s*0\.35/)
  assert.match(powersBlock, /margin-top:\s*auto/)
  assert.match(
    powersBlock,
    /\.discipline-power-option--selected\s+\.discipline-power-option__state/,
  )
  assert.match(
    powersBlock,
    /font-family:\s*var\(--font-family-heading\)/,
  )
})

test('SPEC-010.C.2H añade únicamente tokens reutilizables', () => {
  for (const token of [
    "--color-accent-label-muted:",
    "--color-accent-state:",
    "--color-option-border-muted:",
    "--color-option-hover-border:",
    "--color-selected-border-emphasis:",
    "--color-selected-surface-emphasis:",
    "--color-text-option-subtle:",
    "--color-text-state-muted:"
]) {
    assert.equal(
      designSystem.includes(token),
      true,
      `Falta ${token}`,
    )
  }

  assert.doesNotMatch(
    designSystem,
    /--(?:power|discipline|ritual|ceremony|alchemy)/,
  )
})
