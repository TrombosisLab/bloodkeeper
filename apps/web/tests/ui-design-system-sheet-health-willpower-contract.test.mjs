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
const healthMarker = [
  '/* ==================================================',
  '   002-C — SALUD Y FUERZA DE VOLUNTAD',
].join('\n')
const skillsMarker = [
  '/* ==================================================',
  '   002-D — HABILIDADES',
].join('\n')

const healthStart = sheetStyles.indexOf(healthMarker)
const skillsStart = sheetStyles.indexOf(skillsMarker)

assert.notEqual(healthStart, -1)
assert.notEqual(skillsStart, -1)
assert.equal(skillsStart > healthStart, true)

const beforeHealth = sheetStyles.slice(0, healthStart)
const healthBlock = sheetStyles.slice(
  healthStart,
  skillsStart,
)
const skillsAndLater = sheetStyles.slice(skillsStart)

test('SPEC-010 limita la adopción de ficha al bloque 002-C Salud y Voluntad', () => {
  const prefixHash = createHash('sha256')
    .update(beforeHealth)
    .digest('hex')
  const blockHash = createHash('sha256')
    .update(healthBlock)
    .digest('hex')

  assert.equal(
    prefixHash,
    '4358b594491cf50b89639fb02a37e7bcc977e4d29ea2d98bf7d1f5077eac5f21',
  )
  assert.equal(
    blockHash,
    '4e944786acf9de07c42431de1243539b88886d29d0e04ead7cd8f341dbbf2fcf',
  )
  assert.equal(
    skillsAndLater.startsWith(skillsMarker),
    true,
  )
})

test('SPEC-010 elimina colores y tipografías literales de ficha 002-C', () => {
  assert.doesNotMatch(
    healthBlock,
    /#[0-9a-f]{3,8}\b/i,
  )
  assert.doesNotMatch(
    healthBlock,
    /(?:rgb|rgba|hsl|hsla)\([^)]*\)/i,
  )
  assert.doesNotMatch(
    healthBlock,
    /font-family\s*:\s*Georgia\b/i,
  )
  assert.doesNotMatch(
    healthBlock,
    /font-family\s*:\s*Arial\b/i,
  )
})

test('SPEC-010 aplica tokens compartidos a ficha 002-C', () => {
  for (const token of [
    "var(--color-control-border)",
    "var(--color-control-surface)",
    "var(--color-focus-border)",
    "var(--color-group-border)",
    "var(--color-label-accent)",
    "var(--color-surface)",
    "var(--color-symbol-accent)",
    "var(--color-symbol-soft)",
    "var(--color-text-strong)",
    "var(--color-text-subtle-muted)",
    "var(--font-family-body-soft)",
    "var(--font-family-heading)"
]) {
    assert.equal(
      healthBlock.includes(token),
      true,
      `Falta ${token} en 002-C`,
    )
  }

  assert.equal(
    healthBlock.match(/font-family:\s*var\(--font-family-[^)]+\)/g)?.length,
    2,
    'Salud y Voluntad deben usar dos familias tipográficas oficiales',
  )
})

test('SPEC-010 conserva estructura estados símbolos y responsive de ficha 002-C', () => {
  for (const selector of [
    ".character-trackers",
    ".damage-tracker",
    ".damage-tracker__header",
    ".damage-tracker__label",
    ".damage-tracker__capacity",
    ".damage-tracker__maximum",
    ".damage-tracker__boxes",
    ".damage-box-item",
    ".damage-box-item > .damage-box",
    ".damage-box",
    ".damage-box--available",
    ".damage-box--editable",
    ".damage-box--editable:focus-visible",
    ".damage-box--unavailable",
    ".damage-box__symbol"
]) {
    assert.equal(
      healthBlock.includes(selector),
      true,
      `Falta ${selector}`,
    )
  }

  assert.match(
    healthBlock,
    /@media \(max-width: 900px\)/,
  )
  assert.match(
    healthBlock,
    /@media \(max-width: 600px\)/,
  )
  assert.match(
    healthBlock,
    /\.damage-box--available/,
  )
  assert.match(
    healthBlock,
    /\.damage-box--editable:focus-visible/,
  )
  assert.match(
    healthBlock,
    /\.damage-box--unavailable/,
  )
  assert.match(
    healthBlock,
    /\.damage-box__symbol/,
  )
})

test('SPEC-010 añade a ficha 002-C solo tokens reutilizables', () => {
  for (const token of [
    "--color-control-border:",
    "--color-control-surface:",
    "--color-focus-border:",
    "--color-label-accent:",
    "--color-symbol-accent:",
    "--color-symbol-soft:",
    "--color-text-strong:",
    "--color-text-subtle-muted:",
    "--font-family-body-soft:"
]) {
    assert.equal(
      designSystem.includes(token),
      true,
      `Falta ${token}`,
    )
  }

  assert.doesNotMatch(
    designSystem,
    /--(?:damage|health|willpower|tracker|damage-box|character-sheet)-/,
  )
})
