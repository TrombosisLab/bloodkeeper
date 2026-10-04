import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
const css = readFileSync(new URL('../src/features/chronicle-space/components/chronicle-space-prototype.css', import.meta.url), 'utf8').split('/* BOARD_DARK_CARDS_V1:')[1]
test('every research card type has an automatic presentation', () => {
  for (const kind of ['pnj', 'personaje', 'lugar', 'documento', 'organizacion', 'artefacto']) assert.ok(css.includes(`:has(.card-pin--${kind})`))
  assert.match(css, /--board-card-accent: #d47b87/)
})
test('visual overrides do not alter card geometry or connection scope', () => {
  assert.doesNotMatch(css, /(?:^|[;{\s])(?:width|height|min-height|left|top|position|z-index)\s*:/)
  assert.doesNotMatch(css, /board-link|scope-personal|scope-shared/)
  assert.match(css, /transform: none/)
})
test('compact title and keyboard actions remain legible', () => {
  assert.match(css, /padding: 14px 12px 32px/)
  assert.match(css, /focus-visible/)
  assert.match(css, /color: #f0e6df/)
})
