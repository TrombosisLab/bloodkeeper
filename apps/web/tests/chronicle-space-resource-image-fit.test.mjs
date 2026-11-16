import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync(new URL('../src/features/chronicle-space/components/chronicle-space-prototype.css', import.meta.url), 'utf8')

test('la imagen principal de una ficha de recurso no recorta caras ni contenido', () => {
  assert.match(css, /\.space-detail__visual--resource img\{[^}]*object-fit:contain/)
})

test('las miniaturas y la imagen de sesión conservan sus reglas independientes', () => {
  assert.match(css, /\.space-detail__visual--session img\{object-position:center 42%\}/)
  assert.match(css, /\.space-detail__visual img\{[^}]*object-fit:cover/)
})
