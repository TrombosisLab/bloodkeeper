import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

const controller = await readFile(
  new URL('../src/chronicles/presentation/chronicle-space-board.controller.ts', import.meta.url),
  'utf8',
)

test('el servidor reserva la escritura de la pizarra compartida a administradores y narradores', () => {
  assert.match(controller, /const canManage = .*roles\.includes\('admin'\).*roles\.includes\('narrator'\)/)
  assert.match(controller, /if \(!canManage\) throw new ForbiddenException\(\{ code: 'CHRONICLE_SPACE_BOARD_SHARED_WRITE_DENIED' \}\)/)
})
