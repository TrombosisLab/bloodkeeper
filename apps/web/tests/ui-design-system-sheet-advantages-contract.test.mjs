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

const advantagesMarker = [
  '/* ==================================================',
  '   002-G — VENTAJAS, TRASFONDOS Y DEFECTOS',
].join('\n')
const convictionsMarker = [
  '/* ==================================================',
  '   002-H — CONVICCIONES Y PIEDRAS DE TOQUE',
].join('\n')

const advantagesStart = sheetStyles.indexOf(
  advantagesMarker,
)
const convictionsStart = sheetStyles.indexOf(
  convictionsMarker,
)

assert.notEqual(advantagesStart, -1)
assert.notEqual(convictionsStart, -1)
assert.equal(convictionsStart > advantagesStart, true)

const beforeAdvantages = sheetStyles.slice(
  0,
  advantagesStart,
)
const advantagesBlock = sheetStyles.slice(
  advantagesStart,
  convictionsStart,
)
const convictionsAndLater = sheetStyles.slice(
  convictionsStart,
)

test('SPEC-010 limita la adopción de ficha al bloque 002-G Ventajas', () => {
  const prefixHash = createHash('sha256')
    .update(beforeAdvantages)
    .digest('hex')
  const blockHash = createHash('sha256')
    .update(advantagesBlock)
    .digest('hex')

  assert.equal(
    prefixHash,
    'c1d9da05d4a234e7636ecd85cd2656b8b7c0c16eaed8aed4120d30d0147c9ee5',
  )
  assert.equal(
    blockHash,
    'e31e671fecd909f6748c7714e00eb61a2d9010bbb314c1e6d8ff2cbaeeae2d92',
  )
  assert.equal(
    convictionsAndLater.startsWith(convictionsMarker),
    true,
  )
})

test('SPEC-010 elimina colores y tipografía literal de ficha 002-G', () => {
  assert.doesNotMatch(
    advantagesBlock,
    /#[0-9a-f]{3,8}\b/i,
  )
  assert.doesNotMatch(
    advantagesBlock,
    /(?:rgb|rgba|hsl|hsla)\([^)]*\)/i,
  )
  assert.doesNotMatch(
    advantagesBlock,
    /font-family\s*:\s*Georgia\b/i,
  )
})

test('SPEC-010 aplica tokens compartidos a ficha 002-G', () => {
  for (const token of [
    "var(--color-accent-border-muted)",
    "var(--color-chip-surface)",
    "var(--color-group-border)",
    "var(--color-group-tint-faint)",
    "var(--color-negative-border)",
    "var(--color-negative-fill)",
    "var(--color-row-divider)",
    "var(--color-section-border)",
    "var(--color-section-tint-faint)",
    "var(--color-surface)",
    "var(--color-text-body-muted)",
    "var(--color-text-chip-muted)",
    "var(--color-text-footnote-muted)",
    "var(--color-text-heading-muted-soft)",
    "var(--color-text-metadata-soft)",
    "var(--color-text-pending)",
    "var(--color-text-support-muted)",
    "var(--color-warning)",
    "var(--color-warning-border-translucent)",
    "var(--font-family-heading)"
]) {
    assert.equal(
      advantagesBlock.includes(token),
      true,
      `Falta ${token} en 002-G`,
    )
  }

  assert.equal(
    advantagesBlock.match(
      /font-family:\s*var\(--font-family-[^)]+\)/g,
    )?.length,
    3,
    'Ventajas debe usar tres declaraciones tipográficas oficiales',
  )
})

test('SPEC-010 conserva grupos estados negativos detalles foco DotRating y responsive de ficha 002-G', () => {
  const normalizedAdvantagesBlock =
    advantagesBlock.replace(/\s+/g, ' ')

  for (const selector of [
    ".advantages-section",
    ".advantages-grid",
    ".trait-group",
    ".trait-group__header",
    ".trait-group__header span",
    ".trait-group__header h3",
    ".trait-group__content",
    ".trait-group__empty",
    ".rated-trait",
    ".rated-trait:last-child",
    ".rated-trait__identity",
    ".rated-trait__identity span",
    ".rated-trait__identity small",
    ".rated-trait__metadata",
    ".rated-trait__metadata span",
    ".rated-trait__metadata .rated-trait__narrative-pending",
    ".rated-trait__details",
    ".rated-trait__details summary",
    ".rated-trait__details summary::marker",
    ".rated-trait__details summary::-webkit-details-marker",
    ".rated-trait__details summary:focus-visible",
    ".advantages-section .dot-rating",
    ".advantages-section .dot-rating__dot",
    ".rated-trait--negative .rated-trait__identity span",
    ".rated-trait--negative .dot-rating__dot--filled"
]) {
    assert.equal(
      normalizedAdvantagesBlock.includes(selector),
      true,
      `Falta ${selector}`,
    )
  }

  assert.match(
    advantagesBlock,
    /@media \(max-width: 900px\)/,
  )
  assert.equal(
    advantagesBlock.match(/linear-gradient\(/g)?.length,
    1,
    'Debe conservarse el gradiente de la sección',
  )
  assert.match(
    advantagesBlock,
    /summary::marker/,
  )
  assert.match(
    advantagesBlock,
    /summary::-webkit-details-marker/,
  )
  assert.match(
    advantagesBlock,
    /summary:focus-visible/,
  )
  assert.match(
    advantagesBlock,
    /rated-trait--negative/,
  )
  assert.match(
    advantagesBlock,
    /rated-trait__narrative-pending/,
  )
  assert.match(
    advantagesBlock,
    /\.advantages-section \.dot-rating__dot/,
  )
  assert.match(
    advantagesBlock,
    /width:\s*12px/,
  )
  assert.match(
    advantagesBlock,
    /height:\s*12px/,
  )
})

test('SPEC-010 añade a ficha 002-G solo tokens reutilizables', () => {
  const newTokens = [
    "--color-accent-border-muted",
    "--color-chip-surface",
    "--color-group-tint-faint",
    "--color-negative-border",
    "--color-negative-fill",
    "--color-section-tint-faint",
    "--color-text-body-muted",
    "--color-text-chip-muted",
    "--color-text-heading-muted-soft",
    "--color-text-metadata-soft",
    "--color-text-pending",
    "--color-warning-border-translucent"
]

  for (const token of newTokens) {
    assert.equal(
      designSystem.includes(`${token}:`),
      true,
      `Falta ${token}`,
    )
    assert.doesNotMatch(
      token,
      /(?:advantage|advantages|merit|flaw|background|trait-group|rated-trait)/i,
    )
  }
})
