import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const component = await readFile(new URL('../src/features/chronicle-space/components/ChronicleSpacePrototype.tsx', import.meta.url), 'utf8')

test('el selector de visibilidad explica quién puede leer la anotación', () => {
  assert.match(component, /<option value="PRIVATE">Privada · solo tú<\/option>/)
  assert.match(component, /<option value="CHRONICLE">Toda la crónica<\/option>/)
})
