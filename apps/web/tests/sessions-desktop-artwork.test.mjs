import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const component = await readFile(resolve(root, 'src/features/chronicles/components/ChronicleSharedSessionWorkspace.tsx'), 'utf8')
const styles = await readFile(resolve(root, 'src/features/chronicles/components/chronicle-shared-session-workspace.css'), 'utf8')

test('los jugadores ven la portada de una sesión compartida en lista y detalle', () => {
  assert.match(component, /assets\/SESSION\/\$\{session\.id\}\/image/)
  assert.match(component, /onError=\{\(\) => setUnavailable\(true\)\}/)
  assert.match(component, /variant="thumbnail"/)
  assert.match(component, /variant="hero"/)
  assert.match(component, /alt=\{`Imagen de \$\{sessionTitle\}`\}/)
})

test('la jerarquía de escritorio usa tarjetas legibles, portada destacada y acentos por contexto', () => {
  assert.match(styles, /SESIONES_COMPARTIDAS_ESCRITORIO_JERARQUIA_V1/)
  assert.match(styles, /@media \(min-width: 1251px\)/)
  assert.match(styles, /\.shared-session-workspace__detail-header/)
  assert.match(styles, /\.shared-session-workspace__privacy/)
  assert.match(styles, /\.shared-session-workspace__artwork--hero/)
})

test('se conserva el punto de quiebre móvil existente', () => {
  assert.match(styles, /@media\s*\(max-width:\s*760px\)/)
  assert.match(component, /shared-session-workspace__privacy/)
})
