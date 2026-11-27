import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/features/dashboard/components/dashboard.css', import.meta.url), 'utf8')
const dashboard = readFileSync(new URL('../src/features/dashboard/components/Dashboard.tsx', import.meta.url), 'utf8')
const desktopBlock = css.match(/\/\* DASHBOARD_DESKTOP_HOME_V1[\s\S]*?\n\}/)?.[0]

test('la nueva distribución solo se activa en escritorio ancho', () => {
  assert.ok(desktopBlock, 'falta el bloque visual de escritorio')
  assert.match(desktopBlock, /@media \(min-width: 1151px\)/)
  assert.doesNotMatch(desktopBlock, /max-width/)
  assert.match(desktopBlock, /"character chronicle"/)
  assert.match(desktopBlock, /"ambition now"/)
})

test('personaje y crónica tienen acentos semánticos diferentes', () => {
  assert.ok(desktopBlock)
  assert.match(desktopBlock, /dashboard-character-panel[\s\S]*rgba\(91, 166, 158/)
  assert.match(desktopBlock, /dashboard-chronicle-panel[\s\S]*rgba\(190, 143, 72/)
  assert.match(desktopBlock, /dashboard-ambition[\s\S]*rgba\(91, 166, 158/)
  assert.match(desktopBlock, /dashboard-now[\s\S]*rgba\(190, 143, 72/)
})

test('el resumen y los indicadores quedan compactos sin retirar el contenido móvil', () => {
  assert.ok(desktopBlock)
  assert.match(desktopBlock, /dashboard > \.dashboard-previous[\s\S]*grid-template-columns: max-content minmax\(0, 1fr\)/)
  assert.match(desktopBlock, /dashboard > \.dashboard-pending[\s\S]*padding: 8px 14px/)
  assert.match(css, /\.dashboard-mobile-chronicles,[\s\S]*\.dashboard-mobile-character,[\s\S]*dashboard-mobile-details\{display:none\}/)
  assert.match(css, /@media\(max-width:600px\)/)
  assert.match(dashboard, /dashboard-mobile-details/)
})
