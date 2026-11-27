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

test('En móvil se navega entre listado y detalle, sin apilarlos', () => {
  assert.match(component, /mobileDetailOpen/)
  assert.match(component, /openHistoryEntry\(entry\.id\)/)
  assert.match(component, /aria-label="Volver al listado"/)
  assert.match(styles, /HISTORY_MOBILE_UX_V2/)
  assert.match(styles, /global-history:not\(\.is-mobile-detail-open\)\s+\.global-history__detail\s*,[\s\S]*?global-history\.is-mobile-detail-open\s+\.global-history__timeline/)
})

test('Volver conserva la posición del listado y el estado de filtros', () => {
  assert.match(component, /mobileListScrollPosition\.current\s*=\s*window\.scrollY/)
  assert.match(component, /window\.scrollTo\(\{\s*top:\s*savedPosition/)
  assert.match(component, /setMobileDetailOpen\(false\)/)
})

test('La navegación exclusiva se limita al móvil y mantiene la imagen sin degradado', () => {
  assert.match(styles, /@media\s*\(max-width:\s*760px\)/)
  assert.match(styles, /history-figure > button\.history-image-button[\s\S]*?background-image:\s*none/)
  assert.match(component, /className="history-image-button"/)
})
