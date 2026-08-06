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

const skillsMarker = [
  '/* ==================================================',
  '   002-D — HABILIDADES',
].join('\n')
const vampiricMarker = [
  '/* ==================================================',
  '   002-E — ESTADO VAMPIRICO',
].join('\n')

const skillsStart = sheetStyles.indexOf(skillsMarker)
const vampiricStart = sheetStyles.indexOf(vampiricMarker)

assert.notEqual(skillsStart, -1)
assert.notEqual(vampiricStart, -1)
assert.equal(vampiricStart > skillsStart, true)

const beforeSkills = sheetStyles.slice(0, skillsStart)
const skillsBlock = sheetStyles.slice(
  skillsStart,
  vampiricStart,
)
const vampiricAndLater = sheetStyles.slice(vampiricStart)

test('SPEC-010 limita la adopción de ficha al bloque 002-D Habilidades', () => {
  const prefixHash = createHash('sha256')
    .update(beforeSkills)
    .digest('hex')
  const blockHash = createHash('sha256')
    .update(skillsBlock)
    .digest('hex')

  assert.equal(
    prefixHash,
    '5a8263308e8ef6c7741a3df28835549ff6a69a85e10e20e7155f55f38c4078cc',
  )
  assert.equal(
    blockHash,
    '8e9337f054e1023bef84e7d60d885233d5d260d8d52b49e96e0cd073df3ecb2f',
  )
  assert.equal(
    vampiricAndLater.startsWith(vampiricMarker),
    true,
  )
})

test('SPEC-010 elimina colores y tipografía literal de ficha 002-D', () => {
  assert.doesNotMatch(
    skillsBlock,
    /#[0-9a-f]{3,8}\b/i,
  )
  assert.doesNotMatch(
    skillsBlock,
    /(?:rgb|rgba|hsl|hsla)\([^)]*\)/i,
  )
  assert.doesNotMatch(
    skillsBlock,
    /font-family\s*:\s*Georgia\b/i,
  )
})

test('SPEC-010 aplica tokens compartidos a ficha 002-D', () => {
  for (const token of [
    "var(--color-group-accent)",
    "var(--color-group-border)",
    "var(--color-group-tint-soft)",
    "var(--color-row-divider)",
    "var(--color-section-border)",
    "var(--color-section-tint-soft)",
    "var(--color-text-soft)",
    "var(--font-family-heading)"
]) {
    assert.equal(
      skillsBlock.includes(token),
      true,
      `Falta ${token} en 002-D`,
    )
  }

  assert.equal(
    skillsBlock.match(
      /font-family:\s*var\(--font-family-[^)]+\)/g,
    )?.length,
    1,
    'Habilidades debe usar la familia tipográfica oficial',
  )
})

test('SPEC-010 conserva estructura DotRating y responsive de ficha 002-D', () => {
  for (const selector of [
    ".skills-section",
    ".skills-grid",
    ".skill-category",
    ".skill-category h3",
    ".skill-category__rows",
    ".skill-row",
    ".skill-row:last-child",
    ".skill-row__label",
    ".skills-section .dot-rating",
    ".skills-section .dot-rating__dot"
]) {
    assert.equal(
      skillsBlock.includes(selector),
      true,
      `Falta ${selector}`,
    )
  }

  assert.match(
    skillsBlock,
    /@media \(max-width: 1000px\)/,
  )
  assert.match(
    skillsBlock,
    /grid-template-columns/,
  )
  assert.match(
    skillsBlock,
    /\.skills-section \.dot-rating/,
  )
  assert.match(
    skillsBlock,
    /\.skills-section \.dot-rating__dot/,
  )
})

test('SPEC-010 añade a ficha 002-D solo tokens reutilizables', () => {
  for (const token of [
    "--color-section-tint-soft:",
    "--color-text-soft:"
]) {
    assert.equal(
      designSystem.includes(token),
      true,
      `Falta ${token}`,
    )
  }

  assert.doesNotMatch(
    designSystem,
    /--(?:skill|skills|specialt|character-sheet)-/,
  )
})
