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

const bloodMarker = [
  '/* ==================================================',
  '   MILESTONE-003 / 003-F — SANGRE',
].join('\n')
const disciplinesMarker = [
  '/* ==================================================',
  '   MILESTONE-003 / 003-G — DISCIPLINAS',
].join('\n')

const [, fromBlood] = creationStyles.split(bloodMarker)
const [bloodBody, disciplinesAndLaterBody] =
  fromBlood.split(disciplinesMarker)

const bloodBlock = bloodMarker + bloodBody
const disciplinesAndLater =
  disciplinesMarker + disciplinesAndLaterBody

test('SPEC-010.C.2F limita la migración al bloque Sangre', () => {
  const suffixHash = createHash('sha256')
    .update(disciplinesAndLater)
    .digest('hex')

  assert.equal(
    suffixHash,
    'd462a17beb71b7f8a2302b147c71163a90e97b435a59ab7af714e783bab507d4',
  )
})

test('SPEC-010.C.2F elimina colores literales de Sangre', () => {
  assert.doesNotMatch(bloodBlock, /#[0-9a-f]{3,8}\b/i)
  assert.doesNotMatch(
    bloodBlock,
    /(?:rgb|rgba|hsl|hsla)\([^)]*\)/i,
  )
})

test('SPEC-010.C.2F adopta tokens visuales compartidos', () => {
  for (const token of [
    "var(--color-accent-border)",
    "var(--color-accent-fill)",
    "var(--color-accent-label)",
    "var(--color-accent-text-soft)",
    "var(--color-accent-value)",
    "var(--color-action-border-muted)",
    "var(--color-control-border-muted)",
    "var(--color-control-text-strong)",
    "var(--color-danger-text-soft)",
    "var(--color-indicator-fill)",
    "var(--color-meter-border)",
    "var(--color-panel-border-strong)",
    "var(--color-panel-glass)",
    "var(--color-selected-border-strong)",
    "var(--color-selected-surface-strong)",
    "var(--color-selected-text-strong)",
    "var(--color-success-border-soft)",
    "var(--color-success-text)",
    "var(--color-success-tint-soft)",
    "var(--color-summary-border)",
    "var(--color-surface)",
    "var(--color-surface-elevated-deep)",
    "var(--color-text-caption)",
    "var(--color-text-control-muted)",
    "var(--color-text-detail-muted)",
    "var(--color-text-disabled)",
    "var(--color-text-heading)",
    "var(--color-text-label-muted)",
    "var(--color-text-value-soft)",
    "var(--color-validation-border-strong)",
    "var(--color-validation-tint-strong)",
    "var(--font-family-heading)",
    "var(--radius-round)"
]) {
    assert.equal(
      bloodBlock.includes(token),
      true,
      `Falta ${token} en Sangre`,
    )
  }
})

test('SPEC-010.C.2F conserva estructura estados y responsive', () => {
  for (const selector of [
    ".blood-step",
    ".blood-step__grid",
    ".blood-panel",
    ".generation-option--active",
    ".blood-rating-control > button:disabled",
    ".blood-rating-control__value",
    ".hunger-editor__dot--filled",
    ".derived-trait-card",
    ".blood-validation--valid",
    ".blood-generation-summary"
]) {
    assert.equal(
      bloodBlock.includes(selector),
      true,
      `Falta ${selector}`,
    )
  }

  for (const mediaQuery of [
    "@media (max-width: 1100px)",
    "@media (max-width: 700px)"
]) {
    assert.equal(
      bloodBlock.includes(mediaQuery),
      true,
      `Falta ${mediaQuery}`,
    )
  }

  assert.match(bloodBlock, /opacity:\s*0\.2/)
  assert.match(bloodBlock, /background:\s*transparent/)
  assert.match(bloodBlock, /min-height:\s*110px/)
  assert.match(
    bloodBlock,
    /border-radius:\s*var\(--radius-round\)/,
  )
})

test('SPEC-010.C.2F añade únicamente tokens reutilizables', () => {
  for (const token of [
    "--color-accent-border:",
    "--color-accent-fill:",
    "--color-accent-label:",
    "--color-accent-text-soft:",
    "--color-accent-value:",
    "--color-action-border-muted:",
    "--color-control-border-muted:",
    "--color-control-text-strong:",
    "--color-danger-text-soft:",
    "--color-meter-border:",
    "--color-panel-border-strong:",
    "--color-selected-border-strong:",
    "--color-selected-surface-strong:",
    "--color-selected-text-strong:",
    "--color-success-border-soft:",
    "--color-success-text:",
    "--color-success-tint-soft:",
    "--color-text-caption:",
    "--color-text-control-muted:",
    "--color-text-detail-muted:",
    "--color-text-disabled:",
    "--color-text-heading:",
    "--color-text-label-muted:",
    "--color-text-value-soft:",
    "--color-validation-border-strong:",
    "--color-validation-tint-strong:"
]) {
    assert.equal(
      designSystem.includes(token),
      true,
      `Falta ${token}`,
    )
  }

  assert.doesNotMatch(
    designSystem,
    /--(?:blood|hunger|generation|derived-trait)/,
  )
})
