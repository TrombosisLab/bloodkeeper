import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const component = await readFile(new URL('../src/features/chronicle-space/components/ChronicleSpacePrototype.tsx', import.meta.url), 'utf8')
const styles = await readFile(new URL('../src/features/chronicle-space/components/chronicle-space-prototype.css', import.meta.url), 'utf8')

test('la Pizarra deja a la vista sus tres acciones frecuentes y pliega las secundarias', () => {
  const bar = component.match(/<div className="board-visibility-bar\b[^"]*">[\s\S]*?(?=\{boardManageOpen \? <div className="board-visibility-panel")/)
  assert.ok(bar, 'debe existir la barra de visibilidad')
  assert.match(bar[0], /Mi vista/)
  assert.match(bar[0], /Vista general/)
  assert.match(bar[0], /Elegir tarjetas/)
  const disclosure = bar[0].match(/<details className="board-advanced-actions">[\s\S]*?<\/details>/)?.[0]
  assert.ok(disclosure, 'debe existir el desplegable nativo')
  assert.match(disclosure, /<summary>Más opciones<\/summary>/)
  for (const action of ['Retirar todas', 'Restaurar posiciones', 'Guardar vista']) assert.match(disclosure, new RegExp(action))
  assert.doesNotMatch(bar[0].replace(disclosure, ''), /Retirar todas|Restaurar posiciones|Guardar vista/)
})

test('el menú secundario se abre sobre el contenido y conserva el ajuste de tablet y móvil', () => {
  assert.match(styles, /\.board-advanced-actions__menu\{position:absolute;[\s\S]*z-index:40/)
  assert.match(styles, /\.board-advanced-actions>summary\{[^}]*cursor:pointer/)
  assert.match(styles, /@media\(max-width:1100px\)\{\.board-selection-tools\{grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/)
  assert.match(styles, /@media\(max-width:760px\)\{\.board-selection-tools\{grid-template-columns:1fr\}/)
})
