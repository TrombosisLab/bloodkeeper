import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync(
  new URL('../src/features/dashboard/components/dashboard.css', import.meta.url),
  'utf8',
)

test('los acentos cromáticos del Inicio se limitan al diseño móvil', () => {
  const marker = 'DASHBOARD_MOBILE_COLOR_ACCENTS_V1'
  const markerIndex = css.indexOf(marker)

  assert.notEqual(markerIndex, -1, 'Falta el bloque de acentos móviles')

  const mobileRules = css.slice(markerIndex)
  assert.match(mobileRules, /@media\s*\(max-width:\s*760px\)/)
  assert.match(mobileRules, /\.dashboard \.dashboard-character-panel/)
  assert.match(mobileRules, /\.dashboard \.dashboard-chronicle-panel/)
  assert.match(mobileRules, /#82bdb6/)
  assert.match(mobileRules, /#c9a66c/)
  assert.doesNotMatch(mobileRules, /\.app-header/)
})
