import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const dashboardSource = await readFile(
  new URL('../src/features/dashboard/components/Dashboard.tsx', import.meta.url),
  'utf8',
)
const dashboardStyles = await readFile(
  new URL('../src/features/dashboard/components/dashboard.css', import.meta.url),
  'utf8',
)

test('Inicio móvil prioriza la crónica elegida y pliega las demás', () => {
  assert.match(dashboardSource, /dashboard-mobile-chronicles/)
  assert.match(dashboardSource, /renderChronicleCard\(selectedChronicle, true\)/)
  assert.match(dashboardSource, /Ver mis otras \{otherChronicles\.length\} crónicas/)
  assert.match(dashboardSource, /otherChronicles\.map\(\(chronicle\) => renderChronicleCard\(chronicle\)\)/)
})

test('Inicio móvil ofrece un resumen del personaje y conserva el selector', () => {
  assert.match(dashboardSource, /dashboard-mobile-character/)
  assert.match(dashboardSource, /dashboard-mobile-character__stats/)
  assert.match(dashboardSource, /characters\.length > 1/)
  assert.match(dashboardSource, />Abrir ficha</)
  for (const stat of ['Hambre', 'Salud', 'Voluntad', 'Humanidad', 'Potencia']) {
    assert.ok(dashboardSource.includes(`<span>${stat}</span>`), `Falta el atributo ${stat}`)
  }
})

test('la información extensa queda plegable sin modificar la vista de escritorio', () => {
  assert.match(dashboardSource, /dashboard-mobile-details/)
  assert.match(dashboardSource, /<summary>Descripción de la crónica<\/summary>/)
  assert.match(dashboardSource, /<summary>Anteriormente<\/summary>/)
  assert.match(dashboardSource, /<summary>Ambición y deseo<\/summary>/)
  assert.match(dashboardSource, /<summary>Ahora mismo<\/summary>/)
  assert.match(dashboardSource, /dashboard-chronicle-cards--desktop/)
  assert.match(dashboardStyles, /@media\s*\(max-width:\s*600px\)/)
  assert.match(dashboardStyles, /\.dashboard-chronicle-cards--desktop\{display:none\}/)
  assert.match(dashboardStyles, /\.dashboard-mobile-chronicles\{display:grid/)
  assert.match(dashboardStyles, /\.dashboard-primary-grid,?[\s\S]*?display:none/)
})

test('los datos de Inicio siguen siendo informativos y no presentan avisos como acciones', () => {
  assert.match(dashboardSource, /dashboard-mobile-pending/)
  assert.match(dashboardSource, /PX disponibles/)
  assert.match(dashboardSource, /notas nuevas del Narrador/)
  assert.doesNotMatch(dashboardSource, /onClick=\{[^}]*pending/)
})

test('los acentos visuales añadidos solo se aplican en móvil, hasta 600 px', () => {
  const accentStyles = dashboardStyles.split('DASHBOARD_MOBILE_COLOR_ACCENTS_V1')[1]
  assert.ok(accentStyles, 'Falta el bloque de acentos móviles')
  assert.match(accentStyles, /@media\s*\(max-width:\s*600px\)/)
  assert.doesNotMatch(accentStyles, /@media\s*\(max-width:\s*760px\)/)
})
