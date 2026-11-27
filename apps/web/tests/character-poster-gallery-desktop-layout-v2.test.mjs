import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/features/character-list/character-list.css', import.meta.url), 'utf8')
const start = css.indexOf('CHARACTER_POSTER_GALLERY_DESKTOP_LAYOUT_V2_BEGIN')
const end = css.indexOf('CHARACTER_POSTER_GALLERY_DESKTOP_LAYOUT_V2_END', start)
const block = start >= 0 && end > start ? css.slice(start, end) : ''

test('la ficha, el concepto y la fecha ocupan filas completas en la carátula desktop', () => {
  assert.ok(block, 'falta el ajuste de jerarquía desktop')
  assert.match(block, /@container character-list \(min-width: 72rem\)/)
  assert.match(block, /\.character-list-card__body[\s\S]*grid-template-columns: minmax\(0, 1fr\)/)
  assert.match(block, /\.character-list-card__identity,[\s\S]*\.character-list-card__concept,[\s\S]*\.character-list-card__updated[\s\S]*grid-area: auto/)
})

test('el estado se mantiene legible en una línea y el título puede ocupar todo el ancho', () => {
  assert.match(block, /\.character-list-card__status[\s\S]*white-space: nowrap/)
  assert.match(block, /\.character-list-card__identity h3[\s\S]*width: 100%/)
  assert.match(block, /\.character-list-card__updated[\s\S]*text-overflow: ellipsis/)
})

test('los personajes sin retrato no reservan una portada alta casi vacía', () => {
  assert.match(block, /\.character-list-card:has\([\s\S]*\.v5-visual-mark\)[\s\S]*max-height: 22rem[\s\S]*aspect-ratio: 5 \/ 4/)
})

test('el ajuste no añade reglas para cabeceras ni para móvil o tablet', () => {
  assert.doesNotMatch(block, /\.app-header|\.app-primary-navigation|@media\s*\(|character-list \(max-width/)
})
