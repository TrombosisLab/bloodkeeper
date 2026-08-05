import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const designSystem = await readFile(
  new URL('../src/styles/design-system.css', import.meta.url),
  'utf8',
)
const styleEntry = await readFile(
  new URL('../src/styles.css', import.meta.url),
  'utf8',
)
const baseStyles = await readFile(
  new URL('../src/styles/base-and-sheet-header.css', import.meta.url),
  'utf8',
)
const packageManifest = JSON.parse(
  await readFile(new URL('../package.json', import.meta.url), 'utf8'),
)

test('SPEC-010.A carga primero la fuente oficial de tokens', () => {
  assert.equal(
    styleEntry.trim().split('\n')[0],
    "@import './styles/design-system.css';",
  )
})

test('SPEC-010.A define las escalas visuales fundamentales', () => {
  for (const token of [
    '--color-canvas:',
    '--color-surface:',
    '--color-text-primary:',
    '--color-border-default:',
    '--color-accent:',
    '--color-focus:',
    '--color-success:',
    '--color-warning:',
    '--color-danger:',
    '--font-family-body:',
    '--font-family-heading:',
    '--space-1:',
    '--space-7:',
    '--radius-sm:',
    '--radius-lg:',
  ]) {
    assert.match(designSystem, new RegExp(token))
  }
})

test('SPEC-010.A adopta tokens en la base y cabecera existentes', () => {
  for (const use of [
    'font-family: var(--font-family-body)',
    'background: var(--color-canvas)',
    'border-bottom: 1px solid var(--color-border-subtle)',
    'border: 1px solid var(--color-border-strong)',
    'color: var(--color-accent)',
    'outline: 2px solid var(--color-focus)',
  ]) {
    assert.match(baseStyles, new RegExp(use.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
})

test('SPEC-010.A conserva accesibilidad y preferencias del usuario', () => {
  assert.match(designSystem, /:focus-visible/)
  assert.match(designSystem, /:disabled/)
  assert.match(designSystem, /prefers-reduced-motion/)
  assert.match(designSystem, /forced-colors/)
})

test('SPEC-010.A no adelanta la biblioteca de componentes', () => {
  for (const selector of [
    '.ui-button',
    '.ui-field',
    '.ui-card',
    '.ui-table',
    '.ui-dialog',
    '.ui-navigation',
    '.ui-alert',
    '.ui-badge',
  ]) {
    assert.equal(designSystem.includes(selector), false)
  }
})

test('SPEC-010.A no incorpora una librería UI externa', () => {
  const dependencies = {
    ...packageManifest.dependencies,
    ...packageManifest.devDependencies,
  }

  for (const dependency of [
    '@mui/material',
    '@chakra-ui/react',
    'antd',
    'bootstrap',
    'tailwindcss',
  ]) {
    assert.equal(dependencies[dependency], undefined)
  }
})
