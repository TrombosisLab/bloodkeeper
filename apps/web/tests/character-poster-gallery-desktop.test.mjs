import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync(new URL('../src/features/character-list/character-list.css', import.meta.url), 'utf8')
const tsx = readFileSync(new URL('../src/features/character-list/components/CharacterList.tsx', import.meta.url), 'utf8')
const start = css.indexOf('CHARACTER_POSTER_GALLERY_DESKTOP_V1_BEGIN')
const end = css.indexOf('CHARACTER_POSTER_GALLERY_DESKTOP_V1_END', start)
const block = start >= 0 && end > start ? css.slice(start, end) : ''

test('Personajes usa tres carátulas y amplía a cuatro solo con espacio suficiente', () => {
  assert.ok(block, 'falta el bloque de galería desktop')
  assert.match(block, /@container character-list \(min-width: 72rem\)/)
  assert.match(block, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/)
  assert.match(block, /@container character-list \(min-width: 84rem\)/)
  assert.match(block, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/)
})

test('cada etapa usa su acento y el retrato funciona como portada', () => {
  assert.match(block, /character-list-card--human[\s\S]*--character-card-accent: #c9a66c/)
  assert.match(block, /character-list-card--transition[\s\S]*--character-card-accent: #d35c70/)
  assert.match(block, /character-list-card--established[\s\S]*--character-card-accent: #6caaa9/)
  assert.match(block, /\.character-list-card__portrait img[\s\S]*object-fit: cover/)
})

test('la galería elimina el scroll interno solo en escritorio y no altera cabeceras', () => {
  assert.match(block, /max-height: none;[\s\S]*overflow: visible/)
  assert.doesNotMatch(block, /\.app-header|\.app-primary-navigation|@media\s*\(\s*max-width/)
  assert.match(css, /@container character-list \(max-width: 39\.99rem\)/)
  assert.match(tsx, /CHARACTER_POSTER_CLASS_V1_BEGIN/)
  assert.match(tsx, /character-list-card--\$\{phase\}/)
})

test('los marcadores delimitan el bloque visual reversible', () => {
  assert.ok(start >= 0)
  assert.ok(end > start)
})
