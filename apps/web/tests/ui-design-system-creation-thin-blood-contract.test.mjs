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
const thinBloodLabel =
  '003-H.5B.2B — Selector de rasgos Sangre Débil'

const labelIndex = creationStyles.indexOf(thinBloodLabel)
const thinBloodStart = creationStyles.lastIndexOf(
  separator,
  labelIndex,
)

assert.notEqual(labelIndex, -1)
assert.notEqual(thinBloodStart, -1)

const earlierStyles = creationStyles.slice(0, thinBloodStart)
const thinBloodBlock = creationStyles.slice(thinBloodStart)

test('SPEC-010.C.2L limita la migración al bloque final Sangre Débil', () => {
  const prefixHash = createHash('sha256')
    .update(earlierStyles)
    .digest('hex')

  assert.equal(
    prefixHash,
    '941188f32bf2d9a275375f40b3a5a27396fd4dafbf4064e4be1c5210a20452ec',
  )
  assert.equal(
    creationStyles.endsWith(thinBloodBlock),
    true,
  )
  assert.equal(
    thinBloodBlock.includes(thinBloodLabel),
    true,
  )
})

test('SPEC-010.C.2L elimina colores literales de Sangre Débil', () => {
  assert.doesNotMatch(
    thinBloodBlock,
    /#[0-9a-f]{3,8}\b/i,
  )
  assert.doesNotMatch(
    thinBloodBlock,
    /(?:rgb|rgba|hsl|hsla)\([^)]*\)/i,
  )
})

test('SPEC-010.C.2L adopta tokens visuales compartidos', () => {
  for (const token of [
    "var(--color-border-control-translucent)",
    "var(--color-border-translucent)",
    "var(--color-control-border-soft)",
    "var(--color-control-indicator-active)",
    "var(--color-control-indicator-border)",
    "var(--color-control-indicator-fill)",
    "var(--color-control-surface-dark)",
    "var(--color-control-text)",
    "var(--color-indicator-fill)",
    "var(--color-surface-control-hover-soft)",
    "var(--color-surface-control-subtle)"
]) {
    assert.equal(
      thinBloodBlock.includes(token),
      true,
      `Falta ${token} en Sangre Débil`,
    )
  }
})

test('SPEC-010.C.2L conserva estructura estados controles y responsive', () => {
  for (const selector of [
    ".thin-blood-traits",
    ".thin-blood-traits__columns",
    ".thin-blood-traits__group",
    ".thin-blood-traits__group > header",
    ".thin-blood-traits__group > header span",
    ".thin-blood-traits__group > header h4",
    ".thin-blood-traits__options",
    ".thin-blood-trait-option",
    ".thin-blood-trait-option:hover",
    ".thin-blood-trait-option--selected",
    ".thin-blood-trait-option span",
    ".thin-blood-trait-option small",
    ".thin-blood-validation",
    ".thin-blood-validation p",
    ".thin-blood-validation ul",
    ".thin-blood-validation li + li",
    ".thin-blood-validation--valid",
    ".thin-blood-validation--invalid",
    ".advantage-sheet-entry",
    ".advantage-sheet-entry--selected",
    ".advantage-sheet-entry > header",
    ".advantage-sheet-entry h4",
    ".advantage-sheet-entry > header span",
    ".advantage-sheet-entry > header small",
    ".advantage-sheet-entry .advantage-catalog-card__ratings",
    ".advantage-rating-control",
    ".advantage-rating-control button",
    ".advantage-rating-control button:disabled",
    ".advantage-rating-control__dots",
    ".advantage-rating-control__dot",
    ".advantage-rating-control__dot--active"
]) {
    assert.equal(
      thinBloodBlock.includes(selector),
      true,
      `Falta ${selector}`,
    )
  }

  for (const mediaQuery of [
    "@media (max-width: 760px)"
]) {
    assert.equal(
      thinBloodBlock.includes(mediaQuery),
      true,
      `Falta ${mediaQuery}`,
    )
  }

  assert.match(
    thinBloodBlock,
    /\.thin-blood-trait-option:hover/,
  )
  assert.match(
    thinBloodBlock,
    /\.thin-blood-trait-option--selected/,
  )
  assert.match(
    thinBloodBlock,
    /\.thin-blood-validation--valid/,
  )
  assert.match(
    thinBloodBlock,
    /\.thin-blood-validation--invalid/,
  )
  assert.match(
    thinBloodBlock,
    /\.advantage-rating-control button:disabled/,
  )
})

test('SPEC-010.C.2L añade únicamente tokens reutilizables', () => {
  for (const token of [
    "--color-control-indicator-active:",
    "--color-control-indicator-border:",
    "--color-control-indicator-fill:",
    "--color-surface-control-hover-soft:",
    "--color-surface-control-subtle:"
]) {
    assert.equal(
      designSystem.includes(token),
      true,
      `Falta ${token}`,
    )
  }

  assert.doesNotMatch(
    designSystem,
    /--(?:thin-blood|thinblood|alchemy|trait|merit|flaw|advantage)/,
  )
})
