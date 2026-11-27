import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const css = readFileSync(
  new URL('../src/styles/v5-visual-assets.css', import.meta.url),
  'utf8',
)

test('la condición y el valor humano comparten una línea solo en escritorio', () => {
  const start = css.indexOf('/* HUMAN_EMBLEM_DESKTOP_LABEL_ROW_V2')
  assert.notEqual(start, -1)
  const block = css.slice(start)
  assert.match(block, /@media\s*\(min-width:\s*761px\)/)
  assert.match(block, /\.clan-mark--human span,\s*\.identity-header-main > \.identity-heading \.clan-mark--human strong\s*\{[^}]*bottom:\s*1\.05rem\s*!important/)
  assert.match(block, /\.clan-mark--human span\s*\{[^}]*left:\s*5\.7rem\s*!important/)
  assert.match(block, /\.clan-mark--human strong\s*\{[^}]*left:\s*calc\(5\.7rem \+ 4\.2rem\)\s*!important/)
})
