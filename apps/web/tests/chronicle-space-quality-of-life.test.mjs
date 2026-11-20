import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const component = await readFile(new URL('../src/features/chronicle-space/components/ChronicleSpacePrototype.tsx', import.meta.url), 'utf8')
const styles = await readFile(new URL('../src/features/chronicle-space/components/chronicle-space-prototype.css', import.meta.url), 'utf8')
const tabletStyles = await readFile(new URL('../src/styles/tablet-workspaces.css', import.meta.url), 'utf8')
const globalStyles = await readFile(new URL('../src/styles.css', import.meta.url), 'utf8')

test('el archivo oculta grupos vacíos y conserva el estado vacío global', () => {
  assert.match(component, /data-empty=\{props\.count === 0 \|\| undefined\}/)
  assert.match(styles, /\.archive-box\[data-empty='true'\]\s*\{\s*display:\s*none;/)
  assert.match(component, /archiveVisibleCount === 0 \? <p className="space-empty archive-empty">/)
})

test('la pizarra recoloca controles antes de que se estreche el panel', () => {
  assert.match(styles, /@media\s*\(max-width:\s*1600px\)[\s\S]*\.space-panel:has\(\.board-filter-bar\)[\s\S]*position:\s*static/)
  assert.match(styles, /\.space-panel:has\(\.board-filter-bar\) > \.board-visibility-bar\s*\{\s*display:\s*flex;\s*flex-direction:\s*column/)
  assert.match(styles, /\.space-panel:has\(\.board-filter-bar\) > \.board-visibility-bar > div\s*\{[^}]*flex-wrap:\s*wrap/)
  assert.match(styles, /max-width:\s*100%/)
})

test('las acciones y pestañas superiores de Investigación se envuelven sin recortarse', () => {
  assert.match(globalStyles, /CHRONICLE_SPACE_HEADER_MEDIUM_WIDTH_V1[\s\S]*\.app-header:has\(\.chronicle-space-global-actions\)[\s\S]*min-width:\s*0[\s\S]*chronicle-space-global-actions__nav\s*\{[^}]*flex-wrap:\s*wrap;\s*overflow:\s*visible/)
})

test('el ajuste final de cabecera cubre anchos intermedios sin competir con las reglas desktop anteriores', () => {
  const responsive = globalStyles.slice(globalStyles.lastIndexOf('INVESTIGATION_RESPONSIVE_STABILITY_V4'))
  assert.match(responsive, /min-width:\s*721px\)[\s\S]*max-width:\s*1600px/)
  assert.match(responsive, /position:\s*static\s*!important/)
  assert.match(responsive, /grid-template-areas:\s*'new chronicle' 'counts counts' 'nav nav'/)
  assert.match(responsive, /@media\s*\(max-width:\s*420px\)/)
})

test('la barra de controles de la pizarra permanece en flujo y no se solapa en escritorio, tablet o móvil', () => {
  const responsive = styles.slice(styles.lastIndexOf('INVESTIGATION_BOARD_CONTROLS_FLOW_V5'))
  assert.match(responsive, /\.board-visibility-bar,[\s\S]*position:\s*static\s*!important/)
  assert.match(responsive, /\.space-board-navigation\s*\{[^}]*position:\s*static\s*!important/)
  assert.match(responsive, /@media\s*\(max-width:\s*760px\)[\s\S]*space-board-navigation\s*\{[^}]*display:\s*flex;\s*flex-flow:\s*row\s+wrap/)
  assert.match(responsive, /@media\s*\(max-width:\s*380px\)/)
})

test('la cronología aclara la fecha real de juego y permite desplegar resúmenes largos', () => {
  assert.match(component, /session\.realDate \? dateLabel\(session\.realDate\) : 'Sin fecha'/)
  assert.match(component, /<details className="timeline-card__summary"><summary>Leer resumen completo<\/summary>/)
  assert.match(styles, /\.timeline-card__summary summary[^}]*cursor:\s*pointer/)
})

test('las tarjetas de sesión no lanzan peticiones de imagen cuando no hay portada', () => {
  const timeline = component.slice(component.indexOf('<div className="timeline">'), component.indexOf('<section className="timeline-independent">'))
  assert.match(component, /candidate\.targetType === 'SESSION'/)
  assert.match(timeline, /const sessionCover = timelineSessionCovers\.get\(session\.id\)/)
  assert.match(timeline, /sessionCover \? '' : ' is-missing'/)
  assert.match(timeline, /\{sessionCover \? <img[^>]+src=\{sessionCover\}[\s\S]*?\/> : null\}/)
  assert.doesNotMatch(timeline, /\/api\/chronicles\/.*assets\/SESSION/)
})

test('la navegación lateral no deja un hueco de pie excesivo en tablet dentro de Investigación', () => {
  assert.match(tabletStyles, /application-shell:has\(\.chronicle-space\) \.app-navigation-shell\s*\{\s*padding-bottom:\s*12px;/)
})
