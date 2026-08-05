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

const attributesMarker = [
  '/* ==================================================',
  '   MILESTONE-003 / 003-C — ATRIBUTOS INTERACTIVOS',
].join('\n')
const navigationMarker = [
  '/* ==================================================',
  '   MILESTONE-003 / 003-D — VALIDACION DE NAVEGACION',
].join('\n')

const [, fromAttributes] = creationStyles.split(attributesMarker)
const [attributesBody, navigationAndLaterBody] =
  fromAttributes.split(navigationMarker)

const attributesBlock = attributesMarker + attributesBody
const navigationAndLater =
  navigationMarker + navigationAndLaterBody

test('SPEC-010.C.2B limita la migración al paso Atributos', () => {
  const suffixHash = createHash('sha256')
    .update(navigationAndLater)
    .digest('hex')

  assert.equal(
    suffixHash,
    '405b47dfd9ce340dea1c1275c9e856b0339cfa24e680c038a952345a05987c38',
  )
})

test('SPEC-010.C.2B elimina colores literales de Atributos', () => {
  assert.doesNotMatch(attributesBlock, /#[0-9a-f]{3,8}\b/i)
  assert.doesNotMatch(
    attributesBlock,
    /(?:rgb|rgba|hsl|hsla)\([^)]*\)/i,
  )
})

test('SPEC-010.C.2B adopta tokens visuales compartidos', () => {
  for (const token of [
    'var(--color-panel-border-soft)',
    'var(--color-group-border)',
    'var(--color-control-border-soft)',
    'var(--color-validation-border)',
    'var(--color-success-border)',
    'var(--color-danger-muted)',
    'var(--color-success-muted)',
  ]) {
    assert.equal(
      attributesBlock.includes(token),
      true,
      `Falta el token $var(--transition-fast) en Atributos`,
    )
  }
})

test('SPEC-010.C.2B conserva estructura y responsive de Atributos', () => {
  for (const selector of [
    '.attributes-step__toolbar',
    '.attributes-editor-grid',
    '.attributes-editor-category',
    '.attribute-editor-row',
    '.attribute-editor-row__control button',
    '.attribute-validation',
    '.attribute-validation--valid',
  ]) {
    assert.equal(attributesBlock.includes(selector), true)
  }

  assert.match(attributesBlock, /@media \(max-width: 980px\)/)
  assert.match(attributesBlock, /@media \(max-width: 700px\)/)
})

test('SPEC-010.C.2B añade únicamente tokens reutilizables', () => {
  for (const token of [
    '--color-panel-border-soft:',
    '--color-panel-glass:',
    '--color-group-border:',
    '--color-row-divider:',
    '--color-control-border-soft:',
    '--color-validation-border:',
    '--color-success-border:',
    '--color-danger-muted:',
    '--color-success-muted:',
  ]) {
    assert.match(designSystem, new RegExp(token))
  }

  assert.doesNotMatch(
    designSystem,
    /--(?:creation|identity|attribute)-/,
  )
})
