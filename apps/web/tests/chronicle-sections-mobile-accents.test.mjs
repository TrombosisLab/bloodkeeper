import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(resolve(here, '../src/features/chronicles/components/chronicle-section-mobile-accents.css'), 'utf8')

test('los acentos de las pestañas y elementos seleccionados son solo móviles', () => {
  assert.match(css, /@media\s*\(max-width:\s*760px\)/)
  assert.match(css, /#chronicle-section-participants-tab\[aria-selected='true'\]/)
  assert.match(css, /#chronicle-section-stories-tab\[aria-selected='true'\]/)
  assert.match(css, /#chronicle-section-sessions-tab\[aria-selected='true'\]/)
  assert.match(css, /#78b8b0/i)
  assert.match(css, /#b69acb/i)
  assert.match(css, /#d3b06b/i)
})

test('solo se resaltan selecciones internas, sin teñir los paneles completos', () => {
  assert.match(css, /participant-list li\.is-selected/)
  assert.match(css, /story-card\.is-selected/)
  assert.match(css, /shared-session-workspace li button\.is-selected/)
  assert.doesNotMatch(css, /#chronicle-section-(participants|stories|sessions)-panel\s*\{[^}]*background\s*:/s)
})
