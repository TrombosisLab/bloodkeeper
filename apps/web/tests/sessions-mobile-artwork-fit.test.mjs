import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const styles = await readFile(resolve(root, 'src/features/chronicles/components/chronicle-shared-session-workspace.css'), 'utf8')

test('la portada del detalle ocupa una fila propia y no fuerza el ancho del texto', () => {
  assert.match(styles, /SESIONES_COMPARTIDAS_MOVIL_SIN_DESBORDES_V1/)
  assert.match(styles, /shared-session-workspace__detail-header\s*\{[^}]*display:\s*grid/)
  assert.match(styles, /grid-template-columns:\s*minmax\(0,\s*1fr\)\s*auto/)
  assert.match(styles, /shared-session-workspace__artwork--hero\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/)
  assert.match(styles, /shared-session-workspace__detail-header\s*>\s*div\s*\{[^}]*min-width:\s*0/)
  assert.match(styles, /shared-session-workspace__detail-header h2\s*\{[^}]*overflow-wrap:\s*anywhere/)
})

test('la distribución de escritorio mantiene la portada en su columna', () => {
  assert.match(styles, /@media\s*\(min-width:\s*1251px\)[\s\S]*?shared-session-workspace__artwork--hero\s*\{[^}]*grid-column:\s*auto/)
})

test('se conserva el punto de quiebre móvil existente', () => {
  assert.match(styles, /@media\s*\(max-width:\s*760px\)/)
})
