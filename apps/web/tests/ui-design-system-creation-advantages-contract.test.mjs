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
const advantagesMarker = [
  '/* ================================================================',
  '   Character Creation — Advantages test UI',
].join('\n')

const advantagesStart = creationStyles.indexOf(advantagesMarker)
const nextBoundary = creationStyles.indexOf(
  separator,
  advantagesStart + advantagesMarker.length,
)

assert.notEqual(advantagesStart, -1)
assert.notEqual(nextBoundary, -1)

const advantagesBlock = creationStyles.slice(
  advantagesStart,
  nextBoundary,
)
const laterStyles = creationStyles.slice(nextBoundary)

test('SPEC-010.C.2K limita la migración al bloque Ventajas', () => {
  const suffixHash = createHash('sha256')
    .update(laterStyles)
    .digest('hex')

  assert.equal(
    suffixHash,
    '08818f72a87284faef66dbd161622a7648e1c17c21a3f9b660e62d846fb0eeda',
  )
  assert.equal(
    laterStyles.includes(
      '003-H.5B.2B — Selector de rasgos Sangre Débil',
    ),
    true,
  )
})

test('SPEC-010.C.2K elimina colores literales de Ventajas', () => {
  assert.doesNotMatch(
    advantagesBlock,
    /#[0-9a-f]{3,8}\b/i,
  )
  assert.doesNotMatch(
    advantagesBlock,
    /(?:rgb|rgba|hsl|hsla)\([^)]*\)/i,
  )
})

test('SPEC-010.C.2K adopta tokens visuales compartidos', () => {
  for (const token of [
    "var(--color-border-control-translucent)",
    "var(--color-border-emphasis-translucent)",
    "var(--color-border-hairline)",
    "var(--color-border-high-contrast)",
    "var(--color-border-translucent)",
    "var(--color-surface-card)",
    "var(--color-surface-chip)",
    "var(--color-surface-control-emphasis)",
    "var(--color-surface-input-soft)",
    "var(--color-warning)"
]) {
    assert.equal(
      advantagesBlock.includes(token),
      true,
      `Falta ${token} en Ventajas`,
    )
  }
})

test('SPEC-010.C.2K conserva estructura estados controles y responsive', () => {
  for (const selector of [
    ".advantages-step",
    ".advantages-budget",
    ".advantages-budget > div",
    ".advantages-budget span",
    ".advantages-budget strong",
    ".advantages-category",
    ".advantages-category__heading",
    ".advantages-category__heading span",
    ".advantages-category__heading h3",
    ".advantages-catalog-grid",
    ".advantage-catalog-card",
    ".advantage-catalog-card--selected",
    ".advantage-catalog-card > header",
    ".advantage-catalog-card h4",
    ".advantage-catalog-card__ratings",
    ".advantage-catalog-card__ratings button",
    ".advantage-rating-control",
    ".advantage-rating-control button",
    ".advantage-rating-control button:hover:not(:disabled)",
    ".advantage-rating-control button:disabled",
    ".advantage-rating-control__dots",
    ".advantage-rating-control__dot",
    ".advantage-rating-control__dot--active",
    ".advantage-catalog-card__pending",
    ".advantage-instance-editor",
    ".advantage-instance-block",
    ".advantage-instance-block__narrative-pending",
    ".advantage-instance-editor h5",
    ".advantage-instance-editor label",
    ".advantage-instance-editor input",
    ".advantage-selection-list",
    ".advantage-selection-chip",
    ".advantage-selection-chip button",
    ".advantages-budget__item > div",
    ".advantages-budget__item small",
    ".advantages-budget__item--valid",
    ".advantages-budget__item--valid small",
    ".advantages-budget__item--invalid"
]) {
    assert.equal(
      advantagesBlock.includes(selector),
      true,
      `Falta ${selector}`,
    )
  }

  for (const mediaQuery of [
    "@media (max-width: 1100px)",
    "@media (max-width: 720px)"
]) {
    assert.equal(
      advantagesBlock.includes(mediaQuery),
      true,
      `Falta ${mediaQuery}`,
    )
  }

  assert.match(
    advantagesBlock,
    /\.advantage-rating-control button:hover:not\(:disabled\)/,
  )
  assert.match(
    advantagesBlock,
    /\.advantage-rating-control button:disabled/,
  )
  assert.match(
    advantagesBlock,
    /\.advantages-budget__item--valid/,
  )
  assert.match(
    advantagesBlock,
    /\.advantages-budget__item--invalid/,
  )
})

test('SPEC-010.C.2K añade únicamente tokens reutilizables', () => {
  for (const token of [
    "--color-border-control-translucent:",
    "--color-border-emphasis-translucent:",
    "--color-border-hairline:",
    "--color-border-high-contrast:",
    "--color-border-translucent:",
    "--color-surface-chip:",
    "--color-surface-control-emphasis:",
    "--color-surface-input-soft:"
]) {
    assert.equal(
      designSystem.includes(token),
      true,
      `Falta ${token}`,
    )
  }

  assert.doesNotMatch(
    designSystem,
    /--(?:advantage|merit|flaw|background|loresheet|thin-blood)/,
  )
})
