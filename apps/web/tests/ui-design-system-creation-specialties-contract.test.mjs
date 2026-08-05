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

const specialtiesMarker = [
  '/* ==================================================',
  '   MILESTONE-003 / 003-E — ESPECIALIDADES',
].join('\n')
const bloodMarker = [
  '/* ==================================================',
  '   MILESTONE-003 / 003-F — SANGRE',
].join('\n')

const [, fromSpecialties] = creationStyles.split(specialtiesMarker)
const [specialtiesBody, bloodAndLaterBody] =
  fromSpecialties.split(bloodMarker)

const specialtiesBlock = specialtiesMarker + specialtiesBody
const bloodAndLater = bloodMarker + bloodAndLaterBody

test('SPEC-010.C.2E limita la migración al bloque Especialidades', () => {
  const suffixHash = createHash('sha256')
    .update(bloodAndLater)
    .digest('hex')

  assert.equal(
    suffixHash,
    '8382a1d650327785fb7343ad7e028a188738283bf8e8b4e7feb7c3a6b2537fff',
  )
})

test('SPEC-010.C.2E elimina colores literales de Especialidades', () => {
  assert.doesNotMatch(specialtiesBlock, /#[0-9a-f]{3,8}\b/i)
  assert.doesNotMatch(
    specialtiesBlock,
    /(?:rgb|rgba|hsl|hsla)\([^)]*\)/i,
  )
})

test('SPEC-010.C.2E adopta tokens visuales compartidos', () => {
  for (const token of [
    "var(--color-accent-subtle)",
    "var(--color-action-subtle)",
    "var(--color-border-control-muted)",
    "var(--color-border-item-muted)",
    "var(--color-danger-inline)",
    "var(--color-panel-border-soft)",
    "var(--color-panel-glass)",
    "var(--color-surface)",
    "var(--color-surface-elevated-deep)",
    "var(--color-text-caption-soft)",
    "var(--color-text-disabled-soft)",
    "var(--color-text-field)",
    "var(--color-text-heading-soft)",
    "var(--color-text-item)",
    "var(--color-text-label-soft)",
    "var(--color-text-support-muted)",
    "var(--font-family-heading)",
    "var(--font-size-lg)",
    "var(--space-2)",
    "var(--space-3)",
    "var(--space-5)"
]) {
    assert.equal(
      specialtiesBlock.includes(token),
      true,
      `Falta ${token} en Especialidades`,
    )
  }
})

test('SPEC-010.C.2E conserva estructura y responsive', () => {
  for (const selector of [
    ".skill-specialties-editor",
    ".skill-specialties-editor__heading",
    ".skill-specialties-editor__form",
    ".skill-specialties-editor__empty",
    ".skill-specialties-list",
    ".skill-specialty-chip",
    ".skill-specialties-editor__error"
]) {
    assert.equal(
      specialtiesBlock.includes(selector),
      true,
      `Falta ${selector}`,
    )
  }

  for (const mediaQuery of [
    "@media (max-width: 800px)"
]) {
    assert.equal(
      specialtiesBlock.includes(mediaQuery),
      true,
      `Falta ${mediaQuery}`,
    )
  }

  assert.match(specialtiesBlock, /min-height:\s*42px/)
  assert.match(specialtiesBlock, /background:\s*transparent/)
  assert.match(specialtiesBlock, /select\s*,/)
  assert.match(specialtiesBlock, /input/)
  assert.match(specialtiesBlock, /button/)
})

test('SPEC-010.C.2E añade únicamente tokens reutilizables', () => {
  for (const token of [
    "--color-accent-subtle:",
    "--color-action-subtle:",
    "--color-border-control-muted:",
    "--color-border-item-muted:",
    "--color-danger-inline:",
    "--color-surface-elevated-deep:",
    "--color-text-caption-soft:",
    "--color-text-disabled-soft:",
    "--color-text-field:",
    "--color-text-heading-soft:",
    "--color-text-item:",
    "--color-text-label-soft:",
    "--color-text-support-muted:"
]) {
    assert.equal(
      designSystem.includes(token),
      true,
      `Falta ${token}`,
    )
  }

  assert.doesNotMatch(
    designSystem,
    /--(?:specialt|skill-specialt)/,
  )
})
