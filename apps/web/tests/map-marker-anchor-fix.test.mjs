import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(resolve(here, '../src/features/map/components/chronicle-map.css'), 'utf8')
const anchor = css.slice(css.indexOf('MAP_MARKER_IMAGE_ANCHOR_DESKTOP_V1'))

test('el mapa y sus coordenadas porcentuales comparten altura en escritorio', () => {
  assert.match(anchor, /@media\s*\(min-width:\s*901px\)/)
  assert.match(anchor, /\.chronicle-map-canvas__content\s*\{[^}]*min-height:\s*0/s)
  assert.match(anchor, /\.chronicle-map-canvas__content img\s*\{[^}]*height:\s*auto/s)
  assert.match(anchor, /\.chronicle-map-canvas__content img\s*\{[^}]*min-height:\s*0/s)
  assert.match(anchor, /\.chronicle-map-canvas__content img\s*\{[^}]*object-fit:\s*initial/s)
})

test('la corrección no altera el diseño móvil', () => {
  assert.doesNotMatch(anchor, /max-width/)
})
