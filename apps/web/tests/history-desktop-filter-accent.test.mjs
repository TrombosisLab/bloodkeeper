import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const css = readFileSync('src/features/history/components/global-history-page.css', 'utf8')
const markerAt = css.indexOf('HISTORY_DESKTOP_THREE_ZONE_FILTERS_V1')
const desktopBlock = css.slice(markerAt)

test('Historia diferencia filtros, listado y detalle solo en escritorio', () => {
  assert.notEqual(markerAt, -1, 'falta el acento visual de escritorio')
  assert.match(desktopBlock, /@media\s*\(min-width:\s*1024px\)/)
  assert.match(desktopBlock, /\.global-history__filters\s*\{[^}]*box-shadow:\s*inset 0 3px/)
  assert.match(desktopBlock, /\.global-history__timeline\s*\{[^}]*rgb\(20 23 25/)
  assert.match(desktopBlock, /\.global-history__detail\s*\{[^}]*rgb\(39 25 28/)
  assert.match(desktopBlock, /\.global-history__filters input:focus/)
  assert.doesNotMatch(desktopBlock, /@media\s*\(max-width/)
})
