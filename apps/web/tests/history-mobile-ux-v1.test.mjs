import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const component = readFileSync(
  new URL('../src/features/history/components/GlobalHistoryPage.tsx', import.meta.url),
  'utf8',
)
const styles = readFileSync(
  new URL('../src/features/history/components/global-history-page.css', import.meta.url),
  'utf8',
)

test('Historia ofrece un listado plegable y accesible en móvil', () => {
  assert.match(component, /mobileTimelineOpen/)
  assert.match(component, /aria-expanded=\{mobileTimelineOpen\}/)
  assert.match(component, /aria-controls="global-history-mobile-browser"/)
  assert.match(component, /global-history__mobile-list-toggle/)
  assert.match(component, /setMobileTimelineOpen\(false\)/)
  assert.match(styles, /HISTORY_MOBILE_UX_V1/)
  assert.match(styles, /@media\s*\(max-width:\s*760px\)/)
  assert.match(styles, /global-history__timeline:not\(\.is-mobile-open\)\s*>\s*#global-history-mobile-browser/)
  assert.match(styles, /global-history__timeline\.is-mobile-open\s*>\s*#global-history-mobile-browser/)
})

test('La imagen no hereda el degradado global de los botones', () => {
  assert.match(component, /className="history-image-button"/)
  assert.match(styles, /history-figure > button\.history-image-button[\s\S]*?background-image:\s*none/)
})

test('Las categorías móviles forman una fila deslizable y la imagen cabe en pantalla', () => {
  assert.match(styles, /flex-wrap:\s*nowrap/)
  assert.match(styles, /overflow-x:\s*auto/)
  assert.match(styles, /max-height:\s*min\(55svh,\s*480px\)/)
})
