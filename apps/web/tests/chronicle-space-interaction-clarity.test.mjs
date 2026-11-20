import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const component = await readFile(
  new URL('../src/features/chronicle-space/components/ChronicleSpacePrototype.tsx', import.meta.url),
  'utf8',
)

test('la pizarra explica que hacen falta dos tarjetas y permite cancelar la selección', () => {
  assert.match(component, /visibleCards\.length < 2/)
  assert.match(component, /Para conectar, muestra otra tarjeta con «Elegir tarjetas»/)
  assert.match(component, /Cancelar selección/)
  assert.match(component, /className="board-selection-reset" style=\{\{ marginLeft: "auto" \}\}/)
  assert.match(component, /disabled=\{!canStartBoardConnection\}/)
})

test('la ficha del archivo devuelve al archivo en lugar de prometer volver a la pizarra', () => {
  assert.match(component, /section === 'ARCHIVE' \? 'Volver al archivo' : 'Volver a la pizarra'/)
})
