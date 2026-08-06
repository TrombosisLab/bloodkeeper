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

const stateMarker = [
  '/* ==================================================',
  '   002-E — ESTADO VAMPIRICO',
].join('\n')
const disciplinesMarker = [
  '/* ==================================================',
  '   002-F — DISCIPLINAS',
].join('\n')

const stateStart = sheetStyles.indexOf(stateMarker)
const disciplinesStart = sheetStyles.indexOf(disciplinesMarker)

assert.notEqual(stateStart, -1)
assert.notEqual(disciplinesStart, -1)
assert.equal(disciplinesStart > stateStart, true)

const beforeState = sheetStyles.slice(0, stateStart)
const stateBlock = sheetStyles.slice(
  stateStart,
  disciplinesStart,
)
const disciplinesAndLater = sheetStyles.slice(
  disciplinesStart,
)

test('SPEC-010 limita la adopción de ficha al bloque 002-E Estado vampírico', () => {
  const prefixHash = createHash('sha256')
    .update(beforeState)
    .digest('hex')
  const blockHash = createHash('sha256')
    .update(stateBlock)
    .digest('hex')

  assert.equal(
    prefixHash,
    '0189ae89bde70b057ffdc0e7bcb18c2cc2bd1b41bcf27bac037520eb78a63418',
  )
  assert.equal(
    blockHash,
    'fe5582d4ee83671e2f74f9fd245ad09215da4eace4afc24f692b3f5df26c18de',
  )
  assert.equal(
    disciplinesAndLater.startsWith(disciplinesMarker),
    true,
  )
})

test('SPEC-010 elimina colores y tipografías literales de ficha 002-E', () => {
  assert.doesNotMatch(
    stateBlock,
    /#[0-9a-f]{3,8}\b/i,
  )
  assert.doesNotMatch(
    stateBlock,
    /(?:rgb|rgba|hsl|hsla)\([^)]*\)/i,
  )
  assert.doesNotMatch(
    stateBlock,
    /font-family\s*:\s*Georgia\b/i,
  )
  assert.doesNotMatch(
    stateBlock,
    /font-family\s*:\s*Arial\b/i,
  )
})

test('SPEC-010 aplica tokens compartidos a ficha 002-E', () => {
  for (const token of [
    "var(--color-accent-value-strong)",
    "var(--color-control-border-emphasis)",
    "var(--color-control-surface-deep)",
    "var(--color-control-text-soft)",
    "var(--color-group-border)",
    "var(--color-indicator-border)",
    "var(--color-indicator-border-accent)",
    "var(--color-indicator-border-dark)",
    "var(--color-indicator-border-muted)",
    "var(--color-indicator-border-soft)",
    "var(--color-indicator-border-strong)",
    "var(--color-indicator-fill)",
    "var(--color-indicator-fill-accent)",
    "var(--color-indicator-fill-accent-dark)",
    "var(--color-indicator-fill-deep)",
    "var(--color-indicator-surface-accent)",
    "var(--color-label-accent)",
    "var(--color-section-border)",
    "var(--color-section-tint-medium)",
    "var(--color-surface)",
    "var(--color-symbol-accent-soft)",
    "var(--color-symbol-soft)",
    "var(--color-text-strong)",
    "var(--color-text-subtle-muted)",
    "var(--font-family-body-soft)",
    "var(--font-family-heading)"
]) {
    assert.equal(
      stateBlock.includes(token),
      true,
      `Falta ${token} en 002-E`,
    )
  }

  assert.equal(
    stateBlock.match(
      /font-family:\s*var\(--font-family-[^)]+\)/g,
    )?.length,
    3,
    'Estado vampírico debe usar tres declaraciones tipográficas oficiales',
  )
})

test('SPEC-010 conserva estructura estados accesibles y responsive de ficha 002-E', () => {
  for (const selector of [
    ".sr-only",
    ".state-section",
    ".state-grid",
    ".state-card",
    ".state-card__heading",
    ".state-card__heading span",
    ".state-card__heading strong",
    ".state-card__heading small",
    ".humanity-track",
    ".humanity-box",
    ".humanity-box--filled",
    ".humanity-box--humanity",
    ".humanity-box--stain",
    ".humanity-box__symbol",
    ".humanity-track__controls",
    ".humanity-track__controls button",
    ".humanity-track__controls button:disabled",
    ".humanity-track__controls button:focus-visible",
    ".hunger-track",
    ".hunger-drop",
    ".hunger-drop--filled",
    ".hunger-track__controls",
    ".hunger-track__controls button",
    ".hunger-track__controls button:disabled",
    ".hunger-track__controls button:focus-visible",
    ".blood-potency-display",
    ".blood-potency-display span",
    ".blood-potency-display strong"
]) {
    assert.equal(
      stateBlock.includes(selector),
      true,
      `Falta ${selector}`,
    )
  }

  assert.match(
    stateBlock,
    /@media \(max-width: 900px\)/,
  )
  assert.match(
    stateBlock,
    /@media \(max-width: 600px\)/,
  )
  assert.equal(
    stateBlock.match(/linear-gradient\(/g)?.length,
    3,
    'Deben conservarse los tres gradientes del bloque',
  )
  assert.match(
    stateBlock,
    /\.humanity-box--humanity/,
  )
  assert.match(
    stateBlock,
    /\.humanity-box--stain/,
  )
  assert.match(
    stateBlock,
    /\.hunger-drop--filled/,
  )
  assert.match(
    stateBlock,
    /button:disabled/,
  )
  assert.match(
    stateBlock,
    /button:focus-visible/,
  )
  assert.match(
    stateBlock,
    /\.sr-only/,
  )
})

test('SPEC-010 añade a ficha 002-E solo tokens reutilizables', () => {
  for (const token of [
    "--color-control-border-emphasis:",
    "--color-control-surface-deep:",
    "--color-control-text-soft:",
    "--color-indicator-border-accent:",
    "--color-indicator-border-dark:",
    "--color-indicator-border-muted:",
    "--color-indicator-border-soft:",
    "--color-indicator-border-strong:",
    "--color-indicator-fill-accent:",
    "--color-indicator-fill-accent-dark:",
    "--color-indicator-fill-deep:",
    "--color-indicator-surface-accent:",
    "--color-section-tint-medium:",
    "--color-symbol-accent-soft:"
]) {
    assert.equal(
      designSystem.includes(token),
      true,
      `Falta ${token}`,
    )
  }

  assert.doesNotMatch(
    designSystem,
    /--(?:blood|hunger|humanity|vampiric|state-card|state-section)-/,
  )
  assert.doesNotMatch(
    designSystem,
    /--color-(?:blood|hunger|humanity|vampiric|state-card|state-section)-/,
  )
})
