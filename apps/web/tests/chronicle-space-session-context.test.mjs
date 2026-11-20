import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const component = await readFile(new URL('../src/features/chronicle-space/components/ChronicleSpacePrototype.tsx', import.meta.url), 'utf8')

test('el formulario explica que asociar una anotación a una sesión es opcional y dónde consultarla', () => {
  assert.match(component, /Opcional: vincúlala a una sesión para encontrarla en su cronología\./)
  assert.match(component, /<option value="">Sin sesión<\/option>/)
})
