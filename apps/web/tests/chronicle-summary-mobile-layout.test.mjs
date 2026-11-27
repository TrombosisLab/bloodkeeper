import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const component = readFileSync(new URL('../src/features/chronicles/components/ChronicleSummaryWorkspace.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../src/features/chronicles/components/chronicle-summary-mobile.css', import.meta.url), 'utf8')
const start = styles.indexOf('/* SUMMARY_MOBILE_REFRESH_V1_START */')
const end = styles.indexOf('/* SUMMARY_MOBILE_REFRESH_V1_END */', start)
const mobile = styles.slice(start, end)

test('los acentos cromáticos del Resumen solo afectan a móvil', () => {
  assert.match(mobile, /@media \(max-width: 620px\)/)
  assert.match(mobile, /rgba\(39, 33, 26, \.96\)/)
  assert.match(mobile, /rgba\(24, 36, 42, \.96\)/)
  assert.match(mobile, /rgba\(38, 27, 43, \.95\)/)
  assert.match(mobile, /border-left: 3px solid #b79060/)
})

test('los estados vacíos ocupan toda la fila para mantener su lectura', () => {
  assert.match(styles, /\.summary-story-list li\.summary-empty,[\s\S]*\.summary-event-list li\.summary-empty \{[\s\S]*grid-column: 1 \/ -1;/)
})

test('la actividad se compacta sin ocultar el acceso al historial completo', () => {
  assert.match(mobile, /\.summary-activity-list li:nth-child\(n \+ 3\)\s*\{\s*display: none;/)
  assert.match(component, /Ver toda la actividad/)
})

test('el progreso incluye historias terminadas y el 100% completa las cuatro fases', () => {
  assert.match(component, /const progress = averageProgress\(stories\)/)
  assert.match(component, /if \(progress >= 100\) return 4/)
})

test('la situación actual aprovecha el resumen de la sesión terminada más reciente', () => {
  assert.match(component, /latestCompletedSession\?\.summary/)
  assert.match(component, /right\.updatedAt\.localeCompare\(left\.updatedAt\)/)
})
