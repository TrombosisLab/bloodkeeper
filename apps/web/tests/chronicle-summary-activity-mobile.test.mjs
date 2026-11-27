import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const component = await readFile(resolve(root, 'src/features/chronicles/components/ChronicleSummaryWorkspace.tsx'), 'utf8')
const styles = await readFile(resolve(root, 'src/features/chronicles/components/chronicle-summary-activity-mobile.css'), 'utf8')

test('Actividad reciente limita solo descripciones largas en móvil', () => {
  assert.match(component, /item\.description\.length > 220/)
  assert.match(styles, /@media \(max-width: 760px\)/)
  assert.match(styles, /font-size:\s*\.74rem/)
  assert.match(styles, /line-height:\s*1\.5/)
  assert.match(styles, /-webkit-line-clamp:\s*4/)
  assert.match(styles, /\.summary-activity-description--collapsible:not\(\.summary-activity-description--expanded\)/)
})

test('el control expande y contrae cada descripción con estado accesible', () => {
  assert.match(component, /expandedActivityIds\.has\(item\.id\)/)
  assert.match(component, /aria-expanded=\{expandedActivityIds\.has\(item\.id\)\}/)
  assert.match(component, /aria-controls=\{`summary-activity-\$\{item\.id\}-description`\}/)
  assert.match(component, /Leer resumen completo/)
  assert.match(component, /Mostrar menos/)
})

test('el texto expandido conserva saltos de párrafo y escritorio no recibe el recorte', () => {
  assert.match(styles, /\.summary-activity-description--expanded\s*\{[^}]*white-space:\s*pre-line/s)
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*\.summary-activity-toggle\s*\{\s*display:\s*inline-flex/)
  assert.match(styles, /\.summary-activity-toggle\s*\{\s*display:\s*none;/)
})
