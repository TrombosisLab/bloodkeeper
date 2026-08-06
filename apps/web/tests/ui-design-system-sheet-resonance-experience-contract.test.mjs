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

const resonanceMarker = [
  '/* ==================================================',
  '   002-I — RESONANCIA Y EXPERIENCIA',
].join('\n')
const secondaryMarker = [
  '/* ==================================================',
  '   002-J — ESPECIALIDADES Y SECCIONES SECUNDARIAS',
].join('\n')

const resonanceStart = sheetStyles.indexOf(
  resonanceMarker,
)
const secondaryStart = sheetStyles.indexOf(
  secondaryMarker,
)

assert.notEqual(resonanceStart, -1)
assert.notEqual(secondaryStart, -1)
assert.equal(secondaryStart > resonanceStart, true)

const beforeResonance = sheetStyles.slice(
  0,
  resonanceStart,
)
const resonanceBlock = sheetStyles.slice(
  resonanceStart,
  secondaryStart,
)
const secondaryAndLater = sheetStyles.slice(
  secondaryStart,
)

test('SPEC-010 limita la adopción de ficha al bloque 002-I Resonancia y Experiencia', () => {
  const prefixHash = createHash('sha256')
    .update(beforeResonance)
    .digest('hex')
  const blockHash = createHash('sha256')
    .update(resonanceBlock)
    .digest('hex')

  assert.equal(
    prefixHash,
    '67eef027c44fb0b3125ef1907921b12340eccbb3c9a72dfdfa565078577593cc',
  )
  assert.equal(
    blockHash,
    '31f5f9793dce9deb97959bc49a940d37963e3f1f25b8dc027d51ac9b6431b042',
  )
  assert.equal(
    secondaryAndLater.startsWith(secondaryMarker),
    true,
  )
})

test('SPEC-010 elimina colores y tipografía literal de ficha 002-I', () => {
  assert.doesNotMatch(
    resonanceBlock,
    /#[0-9a-f]{3,8}\b/i,
  )
  assert.doesNotMatch(
    resonanceBlock,
    /(?:rgb|rgba|hsl|hsla)\([^)]*\)/i,
  )
  assert.doesNotMatch(
    resonanceBlock,
    /font-family\s*:\s*Georgia\b/i,
  )
})

test('SPEC-010 aplica tokens compartidos a ficha 002-I', () => {
  for (const token of [
    "var(--color-group-border)",
    "var(--color-row-divider)",
    "var(--color-section-border)",
    "var(--color-section-tint-ghost)",
    "var(--color-surface)",
    "var(--color-text-caption-muted-soft)",
    "var(--color-text-heading-muted-soft)",
    "var(--color-text-label-muted-soft)",
    "var(--color-text-value-soft-soft)",
    "var(--font-family-heading)"
]) {
    assert.equal(
      resonanceBlock.includes(token),
      true,
      `Falta ${token} en 002-I`,
    )
  }

  assert.equal(
    resonanceBlock.match(
      /font-family:\s*var\(--font-family-[^)]+\)/g,
    )?.length,
    2,
    'Resonancia y Experiencia debe usar dos declaraciones tipográficas oficiales',
  )
})

test('SPEC-010 conserva tarjetas valores jerarquía y responsive de ficha 002-I', () => {
  const normalizedResonanceBlock =
    resonanceBlock.replace(/\s+/g, ' ')

  for (const selector of [
    ".blood-experience-grid",
    ".blood-experience-section",
    ".blood-info-card",
    ".blood-info-card strong",
    ".blood-info-card__label",
    ".experience-card",
    ".experience-card > div",
    ".experience-card > div:last-child",
    ".experience-card span",
    ".experience-card strong"
]) {
    assert.equal(
      normalizedResonanceBlock.includes(selector),
      true,
      `Falta ${selector}`,
    )
  }

  assert.match(
    resonanceBlock,
    /@media \(max-width: 900px\)/,
  )
  assert.equal(
    resonanceBlock.match(/linear-gradient\(/g)?.length,
    1,
    'Debe conservarse el gradiente de la sección',
  )
  assert.match(
    resonanceBlock,
    /gap:\s*1px/,
  )
  assert.match(
    resonanceBlock,
    /padding:\s*22px/,
  )
  assert.match(
    resonanceBlock,
    /padding:\s*20px/,
  )
  assert.match(
    resonanceBlock,
    /font-size:\s*1\.45rem/,
  )
  assert.match(
    resonanceBlock,
    /font-size:\s*1\.5rem/,
  )
})

test('SPEC-010 añade a ficha 002-I solo tokens reutilizables', () => {
  const newTokens = [
    "--color-text-caption-muted-soft",
    "--color-text-label-muted-soft",
    "--color-text-value-soft-soft"
]

  for (const token of newTokens) {
    assert.equal(
      designSystem.includes(`${token}:`),
      true,
      `Falta ${token}`,
    )
    assert.doesNotMatch(
      token,
      /(?:resonance|experience|blood|temperament|desire|xp)/i,
    )
  }
})
