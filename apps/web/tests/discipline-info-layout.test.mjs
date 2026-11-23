import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const styles = await readFile(
  new URL('../src/styles/character-creation.css', import.meta.url),
  'utf8',
)

test('el título, el botón de ayuda y la puntuación ocupan columnas separadas', () => {
  assert.match(
    styles,
    /\.discipline-editor-card__heading\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto;/s,
  )
  assert.match(
    styles,
    /\.discipline-editor-card__title\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*auto\s+minmax\(0,\s*1fr\)\s+auto;/s,
  )
  assert.match(styles, /\.discipline-editor-card__title h3\s*\{[^}]*overflow-wrap:\s*anywhere;/s)
})
