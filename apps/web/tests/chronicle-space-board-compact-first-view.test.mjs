import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const component = readFileSync(new URL('../src/features/chronicle-space/components/ChronicleSpacePrototype.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../src/features/chronicle-space/components/chronicle-space-prototype.css', import.meta.url), 'utf8')

test('search stays visible while optional type filters are collapsed', () => {
  assert.match(component, /<div className="board-compact-tools">\s*<div className="board-quick-search">/)
  assert.match(component, /<label htmlFor="board-quick-search-input">Buscar en la pizarra<\/label>/)
  const start = component.indexOf('<details className="board-filter-disclosure">')
  const end = component.indexOf('</details>', start)
  assert.ok(start >= 0 && end > start)
  const disclosure = component.slice(start, end)
  assert.match(disclosure, /<summary>Filtros/)
  assert.match(disclosure, /className="board-filter-bar"/)
  assert.doesNotMatch(disclosure, /className="board-quick-search"/)
  assert.doesNotMatch(disclosure.slice(0, disclosure.indexOf('>') + 1), /\sopen(?:\s|>)/)
})

test('server 84 onboarding and archive-linked resource guidance remain intact', () => {
  assert.match(component, /¿Primera vez aquí\? Guía rápida/)
  assert.match(component, /board-selection-help/)
  assert.match(component, /aparecen aquí cuando están incorporados a esta crónica/)
})

test('secondary actions stay in Más opciones and zoom/reset/fit share the compact toolbar', () => {
  const more = component.indexOf('<details className="board-advanced-actions">')
  const moreEnd = component.indexOf('</details>', more)
  assert.ok(more >= 0 && moreEnd > more)
  const menu = component.slice(more, moreEnd)
  assert.match(menu, /<summary>Más opciones<\/summary>/)
  assert.match(menu, /Retirar todas/)
  assert.match(menu, /Restaurar posiciones/)
  assert.match(menu, /Guardar vista/)
  const toolbarStart = component.indexOf('<div className="board-visibility-bar board-toolbar-v2">')
  const navigationStart = component.indexOf('<div className="space-board-navigation"', toolbarStart)
  const toolbarEnd = component.indexOf('</div>', navigationStart)
  assert.ok(toolbarStart >= 0 && navigationStart > toolbarStart && toolbarEnd > navigationStart)
  assert.match(component, /setBoardZoom\(1\)\}>Restablecer/)
  assert.match(component, /fitBoardToViewport\(\)\}>Ver toda/)
  assert.match(styles, /INVESTIGATION_BOARD_CONTROLS_FLOW_V5/)
  assert.match(styles, /INVESTIGATION_BOARD_COMPACT_FIRST_VIEW_V2/)
  assert.match(styles, /@media\(max-width:420px\)[\s\S]*board-toolbar-v2/)
})

test('privacy guidance is on demand and actionable connection states remain visible', () => {
  assert.match(component, /<details className="board-context-help">/)
  assert.match(component, /Ayuda y privacidad de la pizarra/)
  assert.match(component, /className=\{'board-scope-note board-scope-note--'/)
  assert.match(component, /boardUpdateAvailable \|\| boardSaving \|\| connectionSourceId \?/)
})
