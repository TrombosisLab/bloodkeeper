import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const css = await readFile(
  new URL('../src/features/chronicles/components/chronicle-summary-workspace.css', import.meta.url),
  'utf8',
)

test('el selector específico apila premisa y situación en escritorio', () => {
  const match = css.match(/SUMMARY_DESKTOP_LAYOUT_SPECIFICITY_FIX_V2[\s\S]*?@media\s*\(min-width:\s*1101px\)\s*\{([\s\S]*?)\n\}/)
  assert.ok(match, 'falta la corrección dentro del breakpoint de escritorio')
  assert.match(match[1], /\.chronicle-detail \.chronicle-summary-workspace \.summary-block-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/)
  assert.match(match[1], /\.chronicle-detail \.chronicle-summary-workspace \.summary-block-grid p\s*\{[^}]*max-width:\s*none/)
})

test('el arreglo se limita a escritorio y conserva el breakpoint móvil', () => {
  assert.match(css, /@media\s*\(min-width:\s*1101px\)/)
  assert.match(css, /@media\s*\(max-width:\s*760px\)/)
  const fixIndex = css.indexOf('SUMMARY_DESKTOP_LAYOUT_SPECIFICITY_FIX_V2')
  assert.ok(css.indexOf('@media(max-width:760px)') < fixIndex)
})
