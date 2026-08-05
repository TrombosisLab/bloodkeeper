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
const ritualMarker = [
  '/* ==================================================',
  '   003-G / 6B.12 — RITUAL INICIAL DE HECHICERÍA',
].join('\n')

const ritualStart = creationStyles.indexOf(ritualMarker)
const nextBoundary = creationStyles.indexOf(
  separator,
  ritualStart + ritualMarker.length,
)

assert.notEqual(ritualStart, -1)
assert.notEqual(nextBoundary, -1)

const ritualBlock = creationStyles.slice(
  ritualStart,
  nextBoundary,
)
const laterStyles = creationStyles.slice(nextBoundary)

test('SPEC-010.C.2I limita la migración al Ritual inicial', () => {
  const suffixHash = createHash('sha256')
    .update(laterStyles)
    .digest('hex')

  assert.equal(
    suffixHash,
    '5c7d28038b3c8fe4a14de04af70d6c52c3ab0057876f93c94caab42e0a37458e',
  )
  assert.equal(
    laterStyles.includes(
      '6B.14 — CEREMONIA INICIAL DE OLVIDO',
    ),
    true,
  )
})

test('SPEC-010.C.2I elimina colores literales del Ritual inicial', () => {
  assert.doesNotMatch(
    ritualBlock,
    /#[0-9a-f]{3,8}\b/i,
  )
  assert.doesNotMatch(
    ritualBlock,
    /(?:rgb|rgba|hsl|hsla)\([^)]*\)/i,
  )
})

test('SPEC-010.C.2I adopta tokens visuales compartidos', () => {
  for (const token of [
    "var(--color-accent-rule)",
    "var(--color-card-border-muted)",
    "var(--color-card-hover-border)",
    "var(--color-group-border)",
    "var(--color-panel-border-accent-soft)",
    "var(--color-panel-tint-muted)",
    "var(--color-selected-border-soft)",
    "var(--color-selected-surface-soft)",
    "var(--color-surface)",
    "var(--color-surface-overlay-soft)",
    "var(--color-text-card-title)",
    "var(--color-text-description-muted)",
    "var(--color-text-footnote-muted)",
    "var(--color-text-intro-muted)",
    "var(--color-text-kicker-muted)",
    "var(--color-text-level-muted)",
    "var(--color-text-section-title)",
    "var(--font-family-heading)"
]) {
    assert.equal(
      ritualBlock.includes(token),
      true,
      `Falta ${token} en Ritual inicial`,
    )
  }
})

test('SPEC-010.C.2I conserva estructura estados y responsive', () => {
  for (const selector of [
    ".blood-sorcery-ritual-selector",
    ".blood-sorcery-ritual-selector__heading",
    ".blood-sorcery-ritual-selector__heading span",
    ".blood-sorcery-ritual-selector__heading h3",
    ".blood-sorcery-ritual-selector__heading > strong",
    ".blood-sorcery-ritual-selector__intro",
    ".blood-sorcery-ritual-grid",
    ".blood-sorcery-ritual-card",
    ".blood-sorcery-ritual-card:hover",
    ".blood-sorcery-ritual-card--selected",
    ".blood-sorcery-ritual-card__level",
    ".blood-sorcery-ritual-card > strong",
    ".blood-sorcery-ritual-card p",
    ".blood-sorcery-ritual-card small"
]) {
    assert.equal(
      ritualBlock.includes(selector),
      true,
      `Falta ${selector}`,
    )
  }

  for (const mediaQuery of [
    "@media (max-width: 800px)"
]) {
    assert.equal(
      ritualBlock.includes(mediaQuery),
      true,
      `Falta ${mediaQuery}`,
    )
  }

  assert.match(
    ritualBlock,
    /transition:\s*border-color 120ms ease,\s*background 120ms ease,\s*transform 120ms ease/,
  )
  assert.match(
    ritualBlock,
    /\.blood-sorcery-ritual-card--selected/,
  )
  assert.match(
    ritualBlock,
    /font-family:\s*var\(--font-family-heading\)/,
  )
})

test('SPEC-010.C.2I añade únicamente tokens reutilizables', () => {
  for (const token of [
    "--color-card-border-muted:",
    "--color-card-hover-border:",
    "--color-panel-border-accent-soft:",
    "--color-panel-tint-muted:",
    "--color-selected-border-soft:",
    "--color-selected-surface-soft:",
    "--color-surface-overlay-soft:",
    "--color-text-card-title:",
    "--color-text-description-muted:",
    "--color-text-footnote-muted:",
    "--color-text-intro-muted:",
    "--color-text-kicker-muted:",
    "--color-text-level-muted:",
    "--color-text-section-title:"
]) {
    assert.equal(
      designSystem.includes(token),
      true,
      `Falta ${token}`,
    )
  }

  assert.doesNotMatch(
    designSystem,
    /--(?:ritual|blood-sorcery|ceremony|oblivion|alchemy)/,
  )
})
