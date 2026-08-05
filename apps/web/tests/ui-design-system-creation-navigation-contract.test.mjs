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

const navigationMarker = [
  '/* ==================================================',
  '   MILESTONE-003 / 003-D — VALIDACION DE NAVEGACION',
].join('\n')
const skillsMarker = [
  '/* ==================================================',
  '   MILESTONE-003 / 003-E — HABILIDADES',
].join('\n')

const [, fromNavigation] = creationStyles.split(navigationMarker)
const [navigationBody, skillsAndLaterBody] =
  fromNavigation.split(skillsMarker)

const navigationBlock = navigationMarker + navigationBody
const skillsAndLater = skillsMarker + skillsAndLaterBody

test('SPEC-010.C.2C limita la migración a Validación de Navegación', () => {
  const suffixHash = createHash('sha256')
    .update(skillsAndLater)
    .digest('hex')

  assert.equal(
    suffixHash,
    '66e7d4298ead72a62d45c10c81091f306474a79786463dbab9904cc986d1002b',
  )
})

test('SPEC-010.C.2C elimina colores literales de Navegación', () => {
  assert.doesNotMatch(navigationBlock, /#[0-9a-f]{3,8}\b/i)
  assert.doesNotMatch(
    navigationBlock,
    /(?:rgb|rgba|hsl|hsla)\([^)]*\)/i,
  )
})

test('SPEC-010.C.2C adopta tokens semánticos reutilizables', () => {
  for (const token of [
    'var(--color-danger-border)',
    'var(--color-danger-surface)',
    'var(--color-danger-emphasis)',
    'var(--color-danger-text-muted)',
    'var(--font-family-heading)',
    'var(--font-size-sm)',
    'var(--space-2)',
  ]) {
    assert.equal(
      navigationBlock.includes(token),
      true,
      `Falta ${token} en Validación de Navegación`,
    )
  }
})

test('SPEC-010.C.2C conserva estructura y estados accesibles', () => {
  for (const selector of [
    '.creation-progress__step--locked',
    '.creation-progress__step--locked:hover',
    '.creation-step-errors',
    '.creation-step-errors strong',
    '.creation-step-errors ul',
  ]) {
    assert.equal(navigationBlock.includes(selector), true)
  }

  assert.match(navigationBlock, /cursor:\s*not-allowed/)
  assert.match(navigationBlock, /background:\s*transparent/)
})

test('SPEC-010.C.2C añade únicamente tokens reutilizables', () => {
  for (const token of [
    '--color-danger-border:',
    '--color-danger-surface:',
    '--color-danger-emphasis:',
    '--color-danger-text-muted:',
  ]) {
    assert.match(designSystem, new RegExp(token))
  }

  assert.doesNotMatch(
    designSystem,
    /--(?:navigation|creation-step|step-error)-/,
  )
})
