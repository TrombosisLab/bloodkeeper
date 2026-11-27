import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/features/character-list/character-list.css', import.meta.url), 'utf8')
const start = css.indexOf('CHARACTER_POSTER_GALLERY_DESKTOP_SIZE_V3_BEGIN')
const end = css.indexOf('CHARACTER_POSTER_GALLERY_DESKTOP_SIZE_V3_END', start)
const block = start >= 0 && end > start ? css.slice(start, end) : ''

test('todas las carátulas mantienen el mismo tamaño aunque falte el retrato', () => {
  assert.ok(block, 'falta la regla de tamaño uniforme')
  assert.match(block, /@container character-list \(min-width: 72rem\)/)
  assert.match(block, /\.character-list-card[\s\S]*width: 100%[\s\S]*min-width: 0[\s\S]*aspect-ratio: 4 \/ 5/)
  assert.match(block, /:has\([\s\S]*\.v5-visual-mark\)[\s\S]*min-height: 22rem[\s\S]*max-height: 28rem[\s\S]*aspect-ratio: 4 \/ 5/)
  assert.doesNotMatch(block, /aspect-ratio: 5 \/ 4|max-height: 22rem/)
})

test('el contenido se mantiene dentro de su columna sin ensanchar tarjetas vecinas', () => {
  assert.match(block, /min-width: 0[\s\S]*max-width: 100%/)
  assert.match(block, /\.character-list-card__body[\s\S]*grid-template-columns: minmax\(0, 1fr\)/)
  assert.match(block, /\.character-list-card__identity,[\s\S]*\.character-list-card__concept,[\s\S]*\.character-list-card__updated[\s\S]*grid-area: auto/)
  assert.match(block, /\.character-list-card__status[\s\S]*white-space: nowrap/)
})

test('el dimensionado solo actúa en escritorio y no cambia cabeceras ni móvil/tablet', () => {
  assert.doesNotMatch(block, /\.app-header|\.app-primary-navigation|@media\s*\(|character-list \(max-width/)
})
