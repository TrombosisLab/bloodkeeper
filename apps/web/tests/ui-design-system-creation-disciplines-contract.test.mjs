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

const disciplinesMarker = [
  '/* ==================================================',
  '   MILESTONE-003 / 003-G — DISCIPLINAS',
].join('\n')
const powersMarker = [
  '/* ==================================================',
  '   MILESTONE-003 / 003-G PARTE 5C — PODERES',
].join('\n')

const [, fromDisciplines] =
  creationStyles.split(disciplinesMarker)
const [disciplinesBody, powersAndLaterBody] =
  fromDisciplines.split(powersMarker)

const disciplinesBlock =
  disciplinesMarker + disciplinesBody
const powersAndLater =
  powersMarker + powersAndLaterBody

test('SPEC-010.C.2G limita la migración al bloque Disciplinas', () => {
  const suffixHash = createHash('sha256')
    .update(powersAndLater)
    .digest('hex')

  assert.equal(
    suffixHash,
    'a6e6c031ae02824ddd503094947056c30b052944cb0c5b912eac24a8bf4f3b1e',
  )
})

test('SPEC-010.C.2G elimina colores literales de Disciplinas', () => {
  assert.doesNotMatch(
    disciplinesBlock,
    /#[0-9a-f]{3,8}\b/i,
  )
  assert.doesNotMatch(
    disciplinesBlock,
    /(?:rgb|rgba|hsl|hsla)\([^)]*\)/i,
  )
})

test('SPEC-010.C.2G adopta tokens visuales compartidos', () => {
  for (const token of [
    "var(--color-accent-border-strong)",
    "var(--color-accent-fill-strong)",
    "var(--color-accent-label-strong)",
    "var(--color-accent-rule)",
    "var(--color-accent-value-strong)",
    "var(--color-border-divider-muted)",
    "var(--color-border-section-subtle)",
    "var(--color-control-border-strong)",
    "var(--color-control-text)",
    "var(--color-danger-muted)",
    "var(--color-group-border-soft)",
    "var(--color-indicator-border)",
    "var(--color-indicator-fill)",
    "var(--color-panel-border-accent-muted)",
    "var(--color-panel-border-muted)",
    "var(--color-panel-glass)",
    "var(--color-selected-border-muted)",
    "var(--color-selected-surface-muted)",
    "var(--color-success-border)",
    "var(--color-success-muted)",
    "var(--color-success-tint)",
    "var(--color-summary-border)",
    "var(--color-surface)",
    "var(--color-surface-accent-tint-soft)",
    "var(--color-surface-elevated-deep)",
    "var(--color-text-caption-muted)",
    "var(--color-text-detail-muted)",
    "var(--color-text-emphasis)",
    "var(--color-text-heading-muted)",
    "var(--color-text-heading-strong)",
    "var(--color-text-overline-muted)",
    "var(--color-text-paragraph-muted)",
    "var(--color-text-title-soft)",
    "var(--color-validation-border)",
    "var(--color-validation-tint)",
    "var(--font-family-heading)",
    "var(--radius-round)"
]) {
    assert.equal(
      disciplinesBlock.includes(token),
      true,
      `Falta ${token} en Disciplinas`,
    )
  }
})

test('SPEC-010.C.2G conserva estructura estados y responsive', () => {
  for (const selector of [
    ".disciplines-step",
    ".disciplines-step__clan",
    ".disciplines-step__rule",
    ".discipline-editor-grid",
    ".discipline-editor-card",
    ".discipline-editor-card--selected",
    ".discipline-editor-card__control button:disabled",
    ".discipline-editor-dot--filled",
    ".discipline-validation",
    ".discipline-validation--valid",
    ".discipline-special-case"
]) {
    assert.equal(
      disciplinesBlock.includes(selector),
      true,
      `Falta ${selector}`,
    )
  }

  for (const mediaQuery of [
    "@media (max-width: 600px)",
    "@media (max-width: 950px)"
]) {
    assert.equal(
      disciplinesBlock.includes(mediaQuery),
      true,
      `Falta ${mediaQuery}`,
    )
  }

  assert.match(disciplinesBlock, /opacity:\s*0\.2/)
  assert.match(disciplinesBlock, /background:\s*transparent/)
  assert.match(disciplinesBlock, /min-height:\s*90px/)
  assert.match(
    disciplinesBlock,
    /border-radius:\s*var\(--radius-round\)/,
  )
  assert.match(
    disciplinesBlock,
    /transition:\s*border-color 120ms ease/,
  )
})

test('SPEC-010.C.2G añade únicamente tokens reutilizables', () => {
  for (const token of [
    "--color-accent-border-strong:",
    "--color-accent-fill-strong:",
    "--color-accent-label-strong:",
    "--color-accent-rule:",
    "--color-accent-value-strong:",
    "--color-border-divider-muted:",
    "--color-border-section-subtle:",
    "--color-control-border-strong:",
    "--color-group-border-soft:",
    "--color-indicator-border:",
    "--color-panel-border-accent-muted:",
    "--color-panel-border-muted:",
    "--color-selected-border-muted:",
    "--color-selected-surface-muted:",
    "--color-surface-accent-tint-soft:",
    "--color-text-caption-muted:",
    "--color-text-heading-muted:",
    "--color-text-heading-strong:",
    "--color-text-overline-muted:",
    "--color-text-paragraph-muted:",
    "--color-text-title-soft:"
]) {
    assert.equal(
      designSystem.includes(token),
      true,
      `Falta ${token}`,
    )
  }

  assert.doesNotMatch(
    designSystem,
    /--(?:discipline|power|ritual|ceremony|alchemy)/,
  )
})
