import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const designSystem = await readFile(
  new URL('../src/styles/design-system.css', import.meta.url),
  'utf8',
)
const sheetStyles = await readFile(
  new URL('../src/styles/character-sheet.css', import.meta.url),
  'utf8',
)

const attributesMarker = [
  '/* ==================================================',
  '   002-B — ATRIBUTOS',
].join('\n')
const healthMarker = [
  '/* ==================================================',
  '   002-C — SALUD Y FUERZA DE VOLUNTAD',
].join('\n')

const attributesStart = sheetStyles.indexOf(attributesMarker)
const healthStart = sheetStyles.indexOf(healthMarker)

assert.equal(attributesStart, 0)
assert.notEqual(healthStart, -1)
assert.equal(healthStart > attributesStart, true)

const attributesBlock = sheetStyles.slice(
  attributesStart,
  healthStart,
)
const healthAndLater = sheetStyles.slice(healthStart)

test('SPEC-010 limita la adopción de ficha al bloque 002-B Atributos', () => {
  const attributesHash = createHash('sha256')
    .update(attributesBlock)
    .digest('hex')

  assert.equal(
    attributesHash,
    '4358b594491cf50b89639fb02a37e7bcc977e4d29ea2d98bf7d1f5077eac5f21',
  )
  assert.equal(
    attributesBlock.includes('002-B — ATRIBUTOS'),
    true,
  )
  assert.equal(
    healthAndLater.startsWith(healthMarker),
    true,
  )
})

test('SPEC-010 elimina colores literales de ficha 002-B', () => {
  assert.doesNotMatch(
    attributesBlock,
    /#[0-9a-f]{3,8}\b/i,
  )
  assert.doesNotMatch(
    attributesBlock,
    /(?:rgb|rgba|hsl|hsla)\([^)]*\)/i,
  )
})

test('SPEC-010 aplica tokens compartidos a ficha 002-B', () => {
  for (const token of [
    "var(--color-control-border-accent)",
    "var(--color-control-border-muted-soft)",
    "var(--color-control-indicator-active)",
    "var(--color-control-indicator-border-muted)",
    "var(--color-control-indicator-fill)",
    "var(--color-control-tint)",
    "var(--color-control-tint-active)",
    "var(--color-group-accent)",
    "var(--color-group-border)",
    "var(--color-group-tint-soft)",
    "var(--color-heading-muted)",
    "var(--color-indicator-fill)",
    "var(--color-label-emphasis)",
    "var(--color-row-divider)",
    "var(--color-section-border)",
    "var(--color-section-tint)",
    "var(--color-surface)",
    "var(--color-text-muted-dark)",
    "var(--color-text-subtle-soft)"
]) {
    assert.equal(
      attributesBlock.includes(token),
      true,
      `Falta ${token} en 002-B`,
    )
  }

  assert.equal(
    attributesBlock.match(/var\(--font-family-heading\)/g)?.length,
    4,
    'La ficha debe usar cuatro veces la tipografía oficial',
  )
  assert.equal(
    attributesBlock.match(/var\(--radius-pill\)/g)?.length,
    2,
    'La ficha debe conservar dos controles con radio pill',
  )
  assert.equal(
    attributesBlock.match(/var\(--radius-round\)/g)?.length,
    1,
    'La ficha debe conservar un indicador circular',
  )
})

test('SPEC-010 conserva estructura estados y responsive de ficha 002-B', () => {
  for (const selector of [
    ".attributes-section",
    ".section-title",
    ".section-title h2",
    ".section-number",
    ".attributes-grid",
    ".attribute-category",
    ".attribute-category h3",
    ".attribute-category__rows",
    ".attribute-row",
    ".attribute-row:last-child",
    ".attribute-row__label",
    ".dot-rating",
    ".dot-rating--editable",
    ".dot-rating--locked",
    ".dot-rating--error",
    ".dot-rating__dot",
    ".dot-rating__dot--filled",
    ".derived-preview",
    ".derived-preview > div",
    ".derived-preview span",
    ".derived-preview strong"
]) {
    assert.equal(
      attributesBlock.includes(selector),
      true,
      `Falta ${selector}`,
    )
  }

  assert.match(
    attributesBlock,
    /@media \(max-width: 900px\)/,
  )
  assert.match(
    attributesBlock,
    /@media \(max-width: 600px\)/,
  )
  assert.match(
    attributesBlock,
    /\.dot-rating--editable/,
  )
  assert.match(
    attributesBlock,
    /\.dot-rating--locked/,
  )
  assert.match(
    attributesBlock,
    /\.dot-rating--error/,
  )
  assert.match(
    attributesBlock,
    /\.dot-rating__dot--filled/,
  )
})

test('SPEC-010 añade a ficha 002-B solo tokens reutilizables', () => {
  for (const token of [
    "--color-control-border-accent:",
    "--color-control-border-muted-soft:",
    "--color-control-indicator-border-muted:",
    "--color-control-tint:",
    "--color-control-tint-active:",
    "--color-group-tint-soft:",
    "--color-heading-muted:",
    "--color-label-emphasis:",
    "--color-section-border:",
    "--color-section-tint:",
    "--color-text-muted-dark:",
    "--color-text-subtle-soft:"
]) {
    assert.equal(
      designSystem.includes(token),
      true,
      `Falta ${token}`,
    )
  }

  assert.doesNotMatch(
    designSystem,
    /--(?:character-sheet|sheet-attribute|attributes-section|dot-rating)-/,
  )
})
