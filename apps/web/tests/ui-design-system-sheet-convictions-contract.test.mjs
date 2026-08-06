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

const convictionsMarker = [
  '/* ==================================================',
  '   002-H — CONVICCIONES Y PIEDRAS DE TOQUE',
].join('\n')
const resonanceMarker = [
  '/* ==================================================',
  '   002-I — RESONANCIA Y EXPERIENCIA',
].join('\n')

const convictionsStart = sheetStyles.indexOf(
  convictionsMarker,
)
const resonanceStart = sheetStyles.indexOf(
  resonanceMarker,
)

assert.notEqual(convictionsStart, -1)
assert.notEqual(resonanceStart, -1)
assert.equal(resonanceStart > convictionsStart, true)

const beforeConvictions = sheetStyles.slice(
  0,
  convictionsStart,
)
const convictionsBlock = sheetStyles.slice(
  convictionsStart,
  resonanceStart,
)
const resonanceAndLater = sheetStyles.slice(
  resonanceStart,
)

test('SPEC-010 limita la adopción de ficha al bloque 002-H Convicciones', () => {
  const prefixHash = createHash('sha256')
    .update(beforeConvictions)
    .digest('hex')
  const blockHash = createHash('sha256')
    .update(convictionsBlock)
    .digest('hex')

  assert.equal(
    prefixHash,
    'a0ac0e80f56c93ca9615fe4d1db412ee72447f66cbb13581ecb97043185fecad',
  )
  assert.equal(
    blockHash,
    '203fc123eb77540b5285a127500a2d318fa17bf02b9112e5dcb40a83db113129',
  )
  assert.equal(
    resonanceAndLater.startsWith(resonanceMarker),
    true,
  )
})

test('SPEC-010 elimina colores y tipografía literal de ficha 002-H', () => {
  assert.doesNotMatch(
    convictionsBlock,
    /#[0-9a-f]{3,8}\b/i,
  )
  assert.doesNotMatch(
    convictionsBlock,
    /(?:rgb|rgba|hsl|hsla)\([^)]*\)/i,
  )
  assert.doesNotMatch(
    convictionsBlock,
    /font-family\s*:\s*Georgia\b/i,
  )
})

test('SPEC-010 aplica tokens compartidos a ficha 002-H', () => {
  for (const token of [
    "var(--color-group-border)",
    "var(--color-group-tint-ghost)",
    "var(--color-marker-border)",
    "var(--color-row-divider)",
    "var(--color-section-border)",
    "var(--color-section-tint-ghost)",
    "var(--color-surface)",
    "var(--color-text-body-soft)",
    "var(--color-text-content-soft)",
    "var(--color-text-heading-muted-soft)",
    "var(--color-text-note-muted)",
    "var(--color-text-relation-muted)",
    "var(--color-text-support-muted)",
    "var(--font-family-heading)"
]) {
    assert.equal(
      convictionsBlock.includes(token),
      true,
      `Falta ${token} en 002-H`,
    )
  }

  assert.equal(
    convictionsBlock.match(
      /font-family:\s*var\(--font-family-[^)]+\)/g,
    )?.length,
    4,
    'Convicciones debe usar cuatro declaraciones tipográficas oficiales',
  )
})

test('SPEC-010 conserva paneles listas marcadores piedras notas y responsive de ficha 002-H', () => {
  const normalizedConvictionsBlock =
    convictionsBlock.replace(/\s+/g, ' ')

  for (const selector of [
    ".narrative-section",
    ".narrative-grid",
    ".narrative-panel",
    ".narrative-panel header",
    ".narrative-panel header span",
    ".narrative-panel header h3",
    ".narrative-list",
    ".narrative-list li",
    ".narrative-list li:last-child",
    ".narrative-list li::before",
    ".touchstone-list",
    ".touchstone",
    ".touchstone:last-child",
    ".touchstone strong",
    ".touchstone span",
    ".narrative-panel--notes p"
]) {
    assert.equal(
      normalizedConvictionsBlock.includes(selector),
      true,
      `Falta ${selector}`,
    )
  }

  assert.match(
    convictionsBlock,
    /@media \(max-width: 900px\)/,
  )
  assert.equal(
    convictionsBlock.match(/linear-gradient\(/g)?.length,
    1,
    'Debe conservarse el gradiente de la sección',
  )
  assert.match(
    convictionsBlock,
    /\.narrative-list li::before/,
  )
  assert.match(
    convictionsBlock,
    /width:\s*7px/,
  )
  assert.match(
    convictionsBlock,
    /height:\s*7px/,
  )
  assert.match(
    convictionsBlock,
    /min-height:\s*82px/,
  )
  assert.match(
    convictionsBlock,
    /min-height:\s*62px/,
  )
})

test('SPEC-010 añade a ficha 002-H solo tokens reutilizables', () => {
  const newTokens = [
    "--color-group-tint-ghost",
    "--color-marker-border",
    "--color-section-tint-ghost",
    "--color-text-content-soft",
    "--color-text-note-muted",
    "--color-text-relation-muted"
]

  for (const token of newTokens) {
    assert.equal(
      designSystem.includes(`${token}:`),
      true,
      `Falta ${token}`,
    )
    assert.doesNotMatch(
      token,
      /(?:conviction|touchstone|narrative|humanity|stain)/i,
    )
  }
})
