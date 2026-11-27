import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const component = readFileSync(new URL('../src/features/chronicles/components/ChronicleSummaryWorkspace.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../src/features/chronicles/components/chronicle-summary-mobile.css', import.meta.url), 'utf8')
const start = styles.indexOf('/* SUMMARY_MOBILE_DENSITY_V1_START */')
const end = styles.indexOf('/* SUMMARY_MOBILE_DENSITY_V1_END */', start)
const mobile = styles.slice(start, end)

test('la premisa se puede expandir y solo se limita visualmente en móvil', () => {
  assert.match(component, /aria-expanded=\{premiseExpanded\}/)
  assert.match(component, /aria-controls="chronicle-summary-premise"/)
  assert.match(component, /Leer premisa completa/)
  assert.match(mobile, /@media \(max-width: 620px\)/)
  assert.match(mobile, /-webkit-line-clamp: 4/)
  assert.match(mobile, /@media \(min-width: 621px\)/)
})

test('el encabezado del resumen conserva título y estado con menos altura en móvil', () => {
  assert.match(component, /id="chronicle-summary-title">Resumen/)
  assert.match(component, /summary-status/)
  assert.match(mobile, /summary-card--identity h2\s*\{\s*font-size: 1rem/)
})

test('la tarjeta sin próxima sesión omite explicación y barra vacía solo en móvil', () => {
  assert.match(component, /summary-card--session-empty/)
  assert.match(component, /summary-session-empty-copy/)
  assert.match(mobile, /summary-card--session-empty > \.summary-session-empty-copy,[\s\S]*summary-meter[\s\S]*display: none/)
})

test('las tarjetas vacías se compactan sin perder los accesos a historias y cronología', () => {
  assert.match(component, /summary-card--stories-empty/)
  assert.match(component, /summary-card--events-empty/)
  assert.match(component, /Ver todas/)
  assert.match(component, /aria-label="Ver todos los sucesos"/)
  assert.match(component, /Ver cronología/)
  assert.match(mobile, /summary-card--stories-empty,[\s\S]*summary-card--events-empty\s*\{\s*padding-block: \.58rem/)
})
