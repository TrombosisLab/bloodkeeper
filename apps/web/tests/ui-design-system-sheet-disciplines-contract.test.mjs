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

const disciplinesMarker = [
  '/* ==================================================',
  '   002-F — DISCIPLINAS',
].join('\n')
const advantagesMarker = [
  '/* ==================================================',
  '   002-G — VENTAJAS, TRASFONDOS Y DEFECTOS',
].join('\n')

const disciplinesStart = sheetStyles.indexOf(
  disciplinesMarker,
)
const advantagesStart = sheetStyles.indexOf(
  advantagesMarker,
)

assert.notEqual(disciplinesStart, -1)
assert.notEqual(advantagesStart, -1)
assert.equal(advantagesStart > disciplinesStart, true)

const beforeDisciplines = sheetStyles.slice(
  0,
  disciplinesStart,
)
const disciplinesBlock = sheetStyles.slice(
  disciplinesStart,
  advantagesStart,
)
const advantagesAndLater = sheetStyles.slice(
  advantagesStart,
)

test('SPEC-010 limita la adopción de ficha al bloque 002-F Disciplinas', () => {
  const prefixHash = createHash('sha256')
    .update(beforeDisciplines)
    .digest('hex')
  const blockHash = createHash('sha256')
    .update(disciplinesBlock)
    .digest('hex')

  assert.equal(
    prefixHash,
    'd5cd1cb97af8ec4ee3bb978f13f618b71e4417042ce64b71536d2bafe120035b',
  )
  assert.equal(
    blockHash,
    '50b193d4abb761bc2793d7c01759355fc9dbadfa1ff6807e8e587d2fd5fc3a23',
  )
  assert.equal(
    advantagesAndLater.startsWith(advantagesMarker),
    true,
  )
})

test('SPEC-010 elimina colores y tipografía literal de ficha 002-F', () => {
  assert.doesNotMatch(
    disciplinesBlock,
    /#[0-9a-f]{3,8}\b/i,
  )
  assert.doesNotMatch(
    disciplinesBlock,
    /(?:rgb|rgba|hsl|hsla)\([^)]*\)/i,
  )
  assert.doesNotMatch(
    disciplinesBlock,
    /font-family\s*:\s*Georgia\b/i,
  )
})

test('SPEC-010 aplica tokens compartidos a ficha 002-F', () => {
  for (const token of [
    "var(--color-focus)",
    "var(--color-group-border)",
    "var(--color-label-accent)",
    "var(--color-row-divider)",
    "var(--color-section-border)",
    "var(--color-section-tint-subtle)",
    "var(--color-surface)",
    "var(--color-text-body-soft)",
    "var(--color-text-detail-muted-soft)",
    "var(--color-text-footnote-muted)",
    "var(--color-text-heading-soft-soft)",
    "var(--color-text-kicker-muted-soft)",
    "var(--color-text-metadata-muted)",
    "var(--font-family-heading)"
]) {
    assert.equal(
      disciplinesBlock.includes(token),
      true,
      `Falta ${token} en 002-F`,
    )
  }

  assert.equal(
    disciplinesBlock.match(
      /font-family:\s*var\(--font-family-[^)]+\)/g,
    )?.length,
    3,
    'Disciplinas debe usar tres declaraciones tipográficas oficiales',
  )
})

test('SPEC-010 conserva estructura detalles foco DotRating y responsive de ficha 002-F', () => {
  for (const selector of [
    ".disciplines-section",
    ".disciplines-grid",
    ".discipline-card",
    ".discipline-card__header",
    ".discipline-card__kicker",
    ".discipline-card h3",
    ".discipline-card__powers",
    ".discipline-card__powers-label",
    ".discipline-card__powers ul",
    ".discipline-card__powers li",
    ".discipline-card__powers li:last-child",
    ".discipline-card__powers li span",
    ".discipline-card__powers li small",
    ".discipline-card__empty",
    ".discipline-power-details",
    ".discipline-power-details summary",
    ".discipline-power-details summary::marker",
    ".discipline-power-details summary:focus-visible",
    ".discipline-power-details__content",
    ".discipline-power-details__content p",
    ".discipline-power-details__content small",
    ".disciplines-section .dot-rating__dot"
]) {
    assert.equal(
      disciplinesBlock.includes(selector),
      true,
      `Falta ${selector}`,
    )
  }

  assert.match(
    disciplinesBlock,
    /@media \(max-width: 900px\)/,
  )
  assert.equal(
    disciplinesBlock.match(/linear-gradient\(/g)?.length,
    1,
    'Debe conservarse el gradiente del bloque',
  )
  assert.match(
    disciplinesBlock,
    /summary::marker/,
  )
  assert.match(
    disciplinesBlock,
    /summary:focus-visible/,
  )
  assert.match(
    disciplinesBlock,
    /\.disciplines-section \.dot-rating__dot/,
  )
  assert.match(
    disciplinesBlock,
    /width:\s*13px/,
  )
  assert.match(
    disciplinesBlock,
    /height:\s*13px/,
  )
})

test('SPEC-010 añade a ficha 002-F solo tokens reutilizables', () => {
  const newTokens = [
    "--color-section-tint-subtle",
    "--color-text-body-soft",
    "--color-text-detail-muted-soft",
    "--color-text-heading-soft-soft",
    "--color-text-kicker-muted-soft",
    "--color-text-metadata-muted"
]

  for (const token of newTokens) {
    assert.equal(
      designSystem.includes(`${token}:`),
      true,
      `Falta ${token}`,
    )
    assert.doesNotMatch(
      token,
      /(?:discipline|disciplines|power|ritual|ceremon)/i,
    )
  }
})
