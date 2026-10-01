import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const source = await readFile(
  new URL('../src/features/chronicle-space/components/ChronicleSpacePrototype.tsx', import.meta.url),
  'utf8',
)
const controller = await readFile(
  new URL('../../api/src/chronicles/presentation/chronicle-space-board.controller.ts', import.meta.url),
  'utf8',
)

test('las conexiones personales se guardan en el estado privado del usuario', () => {
  assert.match(source, /setPersonalBoardConnections\(readPersonalBoardConnections\(state\.personalConnections\)\)/)
  assert.match(source, /personalConnections: personalBoardConnections/)
  assert.match(source, /boardViewMode === 'PERSONAL' \? \[\.\.\.shared, \.\.\.personal\] : shared/)
})

test('la interfaz distingue conexiones privadas y oficiales', () => {
  assert.match(source, /type BoardConnectionScope = 'PERSONAL' \| 'SHARED'/)
  assert.match(source, /Tus conexiones son privadas/)
  assert.match(source, /connection\.scope === 'PERSONAL' \? 'Privada' : 'Oficial'/)
  assert.match(source, /connection\.scope === 'PERSONAL' \|\| canManageSharedBoard/)
})

test('el servidor reserva la escritura de la vista compartida al narrador', () => {
  assert.match(controller, /const canManage = .*roles\.includes\('admin'\).*roles\.includes\('narrator'\)/)
  assert.match(controller, /if \(!canManage\) throw new ForbiddenException\(\{ code: 'CHRONICLE_SPACE_BOARD_SHARED_WRITE_DENIED' \}\)/)
})
