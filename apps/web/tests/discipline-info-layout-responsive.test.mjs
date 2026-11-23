import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const styles = await readFile(
  new URL('../src/styles/character-creation.css', import.meta.url),
  'utf8',
)

test('la cuadrícula adapta el número de tarjetas al ancho disponible', () => {
  assert.match(
    styles,
    /\.discipline-editor-grid\s*\{[^}]*repeat\(auto-fit,\s*minmax\(260px,\s*1fr\)\)/s,
  )
  assert.match(
    styles,
    /@media\s*\(max-width:\s*950px\)[\s\S]*?\.discipline-editor-grid\s*\{\s*grid-template-columns:\s*1fr;/,
  )
})
