import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const controller = await readFile(
  new URL('../src/chronicles/presentation/chronicle-map.controller.ts', import.meta.url),
  'utf8',
)

test('el borrado de mapas está protegido y limpia sus recursos derivados', () => {
  assert.match(controller, /@Delete\(':mapId'\)/)
  assert.match(controller, /CHRONICLE_MAP_NARRATOR_ONLY/)
  assert.match(controller, /CHRONICLE_MAP_HAS_CHILDREN/)
  assert.match(controller, /db\.\$transaction/)
  assert.match(controller, /chronicleAssetImage\.deleteMany/)
  assert.match(controller, /return \{ deleted: true \}/)
})
