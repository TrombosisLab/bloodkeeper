import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../src/features/chronicles/components/ChronicleStoryWorkspace.tsx', import.meta.url), 'utf8')

test('story relation selectors use the Chronicle Resources catalog and retain audience indicators', () => {
  assert.match(source, /\/api\/chronicles\/\$\{chronicleId\}\/resources\?kind=\$\{kind\}/)
  assert.match(source, /credentials: 'include'/)
  assert.match(source, /Solo Narrador/)
  assert.match(source, /Todos los jugadores/)
  assert.match(source, /Jugadores seleccionados/)
  assert.match(source, /contextCatalogError/)
})

test('failed catalog requests are not presented as empty resource lists', () => {
  assert.match(source, /Cargando recursos…/)
  assert.match(source, /role="alert"/)
  assert.match(source, /No se pudieron cargar los recursos de la crónica/)
})
