import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/features/dashboard/components/dashboard.css', import.meta.url), 'utf8')
const start = css.indexOf('DASHBOARD_DESKTOP_CHRONICLE_CARDS_V2_BEGIN')
const end = css.indexOf('DASHBOARD_DESKTOP_CHRONICLE_CARDS_V2_END', start)
const block = start >= 0 && end > start ? css.slice(start, end) : ''

test('las tarjetas desktop usan la portada como fondo y liberan el ancho del texto', () => {
  assert.ok(block, 'falta el bloque de tarjetas escritorio')
  assert.match(block, /@media \(min-width: 1151px\)/)
  assert.match(block, /grid-template-columns: minmax\(0, 1fr\)/)
  assert.match(block, /position: absolute;[\s\S]*inset: 0/)
  assert.match(block, /-webkit-line-clamp: 2/)
})

test('el cambio queda limitado a tarjetas de Inicio y conserva el móvil', () => {
  assert.match(block, /\.dashboard \.dashboard-chronicle-cards--desktop/)
  assert.doesNotMatch(block, /\.app-header|\.app-primary-navigation/)
  assert.doesNotMatch(block, /@media\s*\(\s*max-width/)
  assert.match(css, /@media\(max-width:600px\)/)
})

test('existen marcadores explícitos de inicio y fin para revertir el ajuste', () => {
  assert.ok(start >= 0)
  assert.ok(end > start)
})
