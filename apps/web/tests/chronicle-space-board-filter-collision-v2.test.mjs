import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const styles = await readFile(new URL('../src/features/chronicle-space/components/chronicle-space-prototype.css', import.meta.url), 'utf8')

test('search and filters stay stacked through the 1024px sidebar transition', () => {
  const marker = styles.lastIndexOf('/* BOARD_FILTER_SEARCH_STACK_V3')
  assert.notEqual(marker, -1, 'missing the 1024px collision fix')

  const override = styles.slice(marker)
  assert.match(override, /@media\s*\(max-width:\s*1024px\)/)
  assert.match(override, /\.board-compact-tools\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s)
  assert.match(override, /\.board-compact-tools\s*>\s*\.board-filter-disclosure\s*\{[^}]*width:\s*100%[^}]*min-width:\s*0[^}]*box-sizing:\s*border-box/s)
  assert.match(override, /\.board-filter-disclosure__content\s*\{[^}]*min-width:\s*0/s)
})

test('the new responsive rule is later than the 900px and 980px rules', () => {
  const marker = styles.lastIndexOf('/* BOARD_FILTER_SEARCH_STACK_V3')
  const previous = styles.lastIndexOf('/* BOARD_FILTER_SEARCH_STACK_V2')
  const compactRule = styles.indexOf('.board-compact-tools{display:grid;grid-template-columns:minmax(220px,1fr) auto;')
  assert.ok(compactRule >= 0, 'compact toolbar rule is present')
  assert.ok(previous > compactRule, 'the existing 980px rule is present')
  assert.ok(marker > previous, 'the 1024px override must win in the cascade')
})
