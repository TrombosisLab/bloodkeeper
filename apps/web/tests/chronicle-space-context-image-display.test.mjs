import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const css = fs.readFileSync(new URL('../src/features/chronicle-space/components/chronicle-space-prototype.css', import.meta.url), 'utf8')

test('las imágenes contextuales de las notas se muestran completas', () => {
  assert.match(css, /\.detail-context-image img\{[^}]*height:330px[^}]*object-fit:contain/)
  assert.match(css, /@media\(max-width:760px\)\{\.detail-context-image img\{height:250px\}\}/)
  assert.doesNotMatch(css, /\.detail-context-image img\{[^}]*object-fit:cover/)
})
