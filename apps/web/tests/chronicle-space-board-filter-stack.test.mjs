import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const styles = await readFile(new URL('../src/features/chronicle-space/components/chronicle-space-prototype.css', import.meta.url), 'utf8')

test('search and disclosure stack before their expanded contents can overlap at tablet widths', () => {
  const marker = styles.lastIndexOf('/* BOARD_FILTER_SEARCH_STACK_V1')
  assert.notEqual(marker, -1, 'missing responsive stacking override')

  const responsiveOverride = styles.slice(marker)
  assert.match(responsiveOverride, /@media\s*\(max-width:\s*900px\)[\s\S]*?\.board-compact-tools\s*\{\s*grid-template-columns:\s*minmax\(0,\s*1fr\)/)
  assert.match(responsiveOverride, /\.board-compact-tools\s*>\s*\.board-filter-disclosure\s*\{[^}]*width:\s*100%[^}]*min-width:\s*0[^}]*box-sizing:\s*border-box/s)
  assert.match(responsiveOverride, /\.board-filter-disclosure__content\s*\{[^}]*min-width:\s*0/s)
})

test('the stacking override is later than compact and mobile column rules', () => {
  const marker = styles.lastIndexOf('/* BOARD_FILTER_SEARCH_STACK_V1')
  const compactRule = styles.indexOf('.board-compact-tools{display:grid;grid-template-columns:minmax(220px,1fr) auto;')
  const mobileRule = styles.indexOf('.board-compact-tools{grid-template-columns:minmax(0,1fr) auto;')
  assert.ok(compactRule >= 0, 'compact board toolbar rule is present')
  assert.ok(mobileRule >= 0, 'existing mobile toolbar rule is present')
  assert.ok(marker > compactRule && marker > mobileRule, 'override must win in the cascade')
})
