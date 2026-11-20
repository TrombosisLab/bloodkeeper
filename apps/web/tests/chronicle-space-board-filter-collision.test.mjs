import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const styles = await readFile(new URL('../src/features/chronicle-space/components/chronicle-space-prototype.css', import.meta.url), 'utf8')

test('search and filter disclosure stack through the narrow sidebar breakpoint', () => {
  const marker = styles.lastIndexOf('/* BOARD_FILTER_SEARCH_STACK_V2')
  assert.notEqual(marker, -1, 'missing the narrow-sidebar collision fix')

  const override = styles.slice(marker)
  assert.match(override, /@media\s*\(max-width:\s*980px\)/)
  assert.match(override, /\.board-compact-tools\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s)
  assert.match(override, /\.board-compact-tools\s*>\s*\.board-filter-disclosure\s*\{[^}]*width:\s*100%[^}]*min-width:\s*0[^}]*box-sizing:\s*border-box/s)
  assert.match(override, /\.board-filter-disclosure__content\s*\{[^}]*min-width:\s*0/s)
})

test('the 980px override wins over earlier compact and mobile toolbar rules', () => {
  const marker = styles.lastIndexOf('/* BOARD_FILTER_SEARCH_STACK_V2')
  const compactRule = styles.indexOf('.board-compact-tools{display:grid;grid-template-columns:minmax(220px,1fr) auto;')
  const previousFix = styles.lastIndexOf('/* BOARD_FILTER_SEARCH_STACK_V1')
  assert.ok(compactRule >= 0, 'compact toolbar rule is present')
  assert.ok(previousFix >= 0, 'previous responsive stacking rule is present')
  assert.ok(marker > compactRule && marker > previousFix, 'the new override must win in the cascade')
})
