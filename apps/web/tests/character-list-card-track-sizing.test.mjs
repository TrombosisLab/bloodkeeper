import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const css = readFileSync('src/features/character-list/character-list.css', 'utf8')
const marker = 'CHARACTER_LIST_CARD_TRACK_SIZE_V1'
const rule = css.slice(css.indexOf(marker), css.indexOf('}', css.indexOf(marker)) + 1)

test('the bounded character list preserves intrinsic card heights while scrolling', () => {
  assert.ok(rule.includes('align-content: start;'))
  assert.ok(rule.includes('grid-auto-rows: max-content;'))
  assert.ok(rule.includes('max-height: min(36rem, 62vh);'))
  assert.ok(rule.includes('overflow-y: auto;'))
})
