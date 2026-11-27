import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const stylesheet = readFileSync(
  new URL('../src/features/history/components/global-history-page.css', import.meta.url),
  'utf8',
)

test('la mejora visual de Historia queda aislada a escritorio amplio', () => {
  const marker = '/* HISTORY_DESKTOP_VISUAL_V1 */'
  const start = stylesheet.indexOf(marker)
  assert.notEqual(start, -1, 'falta el bloque visual de escritorio')

  const block = stylesheet.slice(start)
  assert.match(block, /@media\s*\(min-width:\s*1051px\)/)
  assert.match(block, /\.global-history__categories\s*\{[^}]*display:\s*flex/s)
  assert.match(block, /\.global-history__timeline li button\.is-active/)
  assert.match(block, /\.global-history__detail article > header/)
  assert.match(block, /\.global-history__summary/)
})

test('el bloque mantiene filtros y jerarquía de lectura sin alterar reglas móviles', () => {
  const marker = '/* HISTORY_DESKTOP_VISUAL_V1 */'
  const block = stylesheet.slice(stylesheet.indexOf(marker))
  assert.match(block, /button:last-child[\s\S]*?border-color:\s*rgb\(190 143 72/)
  assert.match(block, /max-width:\s*74ch/)
  assert.doesNotMatch(block, /@media\s*\(max-width:/)
})
