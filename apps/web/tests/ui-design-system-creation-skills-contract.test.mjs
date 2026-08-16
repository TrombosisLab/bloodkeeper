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

const skillsMarker = [
  '/* ==================================================',
  '   MILESTONE-003 / 003-E — HABILIDADES',
].join('\n')
const specialtiesMarker = [
  '/* ==================================================',
  '   MILESTONE-003 / 003-E — ESPECIALIDADES',
].join('\n')

const [, fromSkills] = creationStyles.split(skillsMarker)
const [skillsBody, specialtiesAndLaterBody] =
  fromSkills.split(specialtiesMarker)

const skillsBlock = skillsMarker + skillsBody
const specialtiesAndLater =
  specialtiesMarker + specialtiesAndLaterBody

test('SPEC-010.C.2D limita la migración al paso Habilidades', () => {
  const suffixHash = createHash('sha256')
    .update(specialtiesAndLater)
    .digest('hex')

  assert.equal(
    suffixHash,
    'd8dafb8d8ba59e5d27391ef1c167dc02572f068bf9135b65970bfe4a96cbdc33',
  )
})

test('SPEC-010.C.2D elimina colores literales de Habilidades', () => {
  assert.doesNotMatch(skillsBlock, /#[0-9a-f]{3,8}\b/i)
  assert.doesNotMatch(
    skillsBlock,
    /(?:rgb|rgba|hsl|hsla)\([^)]*\)/i,
  )
})

test('SPEC-010.C.2D adopta tokens visuales compartidos', () => {
  for (const token of [
    "var(--color-control-border-soft)",
    "var(--color-control-surface-dark)",
    "var(--color-control-text)",
    "var(--color-danger-muted)",
    "var(--color-group-accent)",
    "var(--color-group-border)",
    "var(--color-group-tint)",
    "var(--color-indicator-fill)",
    "var(--color-option-border)",
    "var(--color-panel-border-soft)",
    "var(--color-panel-glass)",
    "var(--color-row-divider)",
    "var(--color-selected-border)",
    "var(--color-selected-surface)",
    "var(--color-selected-text)",
    "var(--color-success-border)",
    "var(--color-success-muted)",
    "var(--color-success-tint)",
    "var(--color-summary-border)",
    "var(--color-surface)",
    "var(--color-surface-option)",
    "var(--color-text-detail)",
    "var(--color-text-emphasis)",
    "var(--color-text-option)",
    "var(--color-text-option-muted)",
    "var(--color-text-quiet)",
    "var(--color-text-row)",
    "var(--color-text-value)",
    "var(--color-validation-border)",
    "var(--color-validation-tint)",
    "var(--font-family-heading)",
    "var(--font-size-sm)",
    "var(--line-height-normal)",
    "var(--radius-round)",
    "var(--space-1)",
    "var(--space-2)",
    "var(--space-3)",
    "var(--space-4)",
    "var(--space-5)"
]) {
    assert.equal(
      skillsBlock.includes(token),
      true,
      `Falta ${token} en Habilidades`,
    )
  }
})

test('SPEC-010.C.2D conserva estructura y responsive de Habilidades', () => {
  for (const selector of [
    ".skills-step",
    ".skill-method-selector",
    ".skill-method-card",
    ".skill-method-card--active",
    ".skills-step__toolbar",
    ".skills-editor-grid",
    ".skills-editor-category",
    ".skill-editor-row",
    ".skill-editor-row__label",
    ".skill-editor-row__control",
    ".skill-editor-row__control button:disabled",
    ".skill-editor-row__control .dot-rating",
    ".dot-rating__dot--filled",
    ".skill-validation",
    ".skill-validation--valid",
    ".skill-validation__summary",
    ".skill-validation__errors",
    ".skill-validation__ok"
]) {
    assert.equal(
      skillsBlock.includes(selector),
      true,
      `Falta ${selector}`,
    )
  }

  for (const mediaQuery of [
    "@media (max-width: 1100px)",
    "@media (max-width: 700px)"
]) {
    assert.equal(
      skillsBlock.includes(mediaQuery),
      true,
      `Falta ${mediaQuery}`,
    )
  }

  assert.match(skillsBlock, /cursor:\s*not-allowed/)
  assert.match(skillsBlock, /opacity:\s*0\.22/)
})

test('SPEC-010.C.2D añade únicamente tokens reutilizables', () => {
  for (const token of [
    "--color-option-border:",
    "--color-selected-border:",
    "--color-selected-surface:",
    "--color-selected-text:",
    "--color-surface-option:",
    "--color-text-option:",
    "--color-text-option-muted:",
    "--color-text-row:"
]) {
    assert.equal(
      designSystem.includes(token),
      true,
      `Falta ${token}`,
    )
  }

  assert.doesNotMatch(
    designSystem,
    /--(?:skills?|skill-method|skill-validation)-/,
  )
})
