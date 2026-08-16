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
const ceremonyMarker = [
  '/* ==================================================',
  '   003-G / 6B.14 — CEREMONIA INICIAL DE OLVIDO',
].join('\n')

const ceremonyStart = creationStyles.indexOf(ceremonyMarker)
const nextBoundary = creationStyles.indexOf(
  separator,
  ceremonyStart + ceremonyMarker.length,
)

assert.notEqual(ceremonyStart, -1)
assert.notEqual(nextBoundary, -1)

const ceremonyBlock = creationStyles.slice(
  ceremonyStart,
  nextBoundary,
)
const laterStyles = creationStyles.slice(nextBoundary)

test('SPEC-010.C.2J limita la migración a la Ceremonia inicial', () => {
  const suffixHash = createHash('sha256')
    .update(laterStyles)
    .digest('hex')

  assert.equal(
    suffixHash,
    'f032acf14cdcf795769d6559be6afd82b178bfd12257633627f65317b04ee800',
  )
  assert.equal(
    laterStyles.includes(
      'Character Creation — Advantages test UI',
    ),
    true,
  )
})

test('SPEC-010.C.2J elimina colores literales de la Ceremonia inicial', () => {
  assert.doesNotMatch(
    ceremonyBlock,
    /#[0-9a-f]{3,8}\b/i,
  )
  assert.doesNotMatch(
    ceremonyBlock,
    /(?:rgb|rgba|hsl|hsla)\([^)]*\)/i,
  )
})

test('SPEC-010.C.2J adopta tokens visuales compartidos', () => {
  for (const token of [
    "var(--color-accent-rule)",
    "var(--color-card-border-muted)",
    "var(--color-card-hover-border-secondary)",
    "var(--color-group-border)",
    "var(--color-panel-border-accent-soft)",
    "var(--color-panel-tint-secondary)",
    "var(--color-selected-border-secondary)",
    "var(--color-selected-surface-secondary)",
    "var(--color-surface)",
    "var(--color-surface-overlay-soft)",
    "var(--color-text-card-title)",
    "var(--color-text-description-muted)",
    "var(--color-text-footnote-muted)",
    "var(--color-text-intro-muted)",
    "var(--color-text-kicker-secondary)",
    "var(--color-text-level-secondary)",
    "var(--color-text-section-title)",
    "var(--font-family-heading)"
]) {
    assert.equal(
      ceremonyBlock.includes(token),
      true,
      `Falta ${token} en Ceremonia inicial`,
    )
  }
})

test('SPEC-010.C.2J conserva estructura estados y responsive', () => {
  for (const selector of [
    ".oblivion-ceremony-selector",
    ".oblivion-ceremony-selector__heading",
    ".oblivion-ceremony-selector__heading span",
    ".oblivion-ceremony-selector__heading h3",
    ".oblivion-ceremony-selector__heading > strong",
    ".oblivion-ceremony-selector__intro",
    ".oblivion-ceremony-grid",
    ".oblivion-ceremony-card",
    ".oblivion-ceremony-card:hover",
    ".oblivion-ceremony-card--selected",
    ".oblivion-ceremony-card__level",
    ".oblivion-ceremony-card > strong",
    ".oblivion-ceremony-card p",
    ".oblivion-ceremony-card small"
]) {
    assert.equal(
      ceremonyBlock.includes(selector),
      true,
      `Falta ${selector}`,
    )
  }

  for (const mediaQuery of [
    "@media (max-width: 800px)"
]) {
    assert.equal(
      ceremonyBlock.includes(mediaQuery),
      true,
      `Falta ${mediaQuery}`,
    )
  }

  assert.match(
    ceremonyBlock,
    /transition:\s*border-color 120ms ease,\s*background 120ms ease,\s*transform 120ms ease/,
  )
  assert.match(
    ceremonyBlock,
    /\.oblivion-ceremony-card--selected/,
  )
  assert.match(
    ceremonyBlock,
    /font-family:\s*var\(--font-family-heading\)/,
  )
})

test('SPEC-010.C.2J añade únicamente tokens reutilizables', () => {
  for (const token of [
    "--color-card-hover-border-secondary:",
    "--color-panel-tint-secondary:",
    "--color-selected-border-secondary:",
    "--color-selected-surface-secondary:",
    "--color-text-kicker-secondary:",
    "--color-text-level-secondary:"
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
