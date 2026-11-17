import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync(new URL('../src/styles/bloodkeeper-visual-system.css', import.meta.url), 'utf8')

test('el listado de PNJ permite desplazamiento táctil vertical en móvil', () => {
  const rule = css.match(/@media \(max-width: 760px\) \{\s*\.chronicle-detail \.chronicle-resource-catalog__browser \{([^}]+)\}/)
  assert.ok(rule, 'Debe existir una regla móvil específica para el listado de PNJ')
  assert.match(rule[1], /overflow-y:\s*auto/)
  assert.match(rule[1], /touch-action:\s*pan-y/)
  assert.match(rule[1], /-webkit-overflow-scrolling:\s*touch/)
})
