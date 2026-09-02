import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const source = fs.readFileSync(
  new URL('../src/features/chronicles/components/ChroniclePlayWorkspace.tsx', import.meta.url),
  'utf8',
)

test('SPEC-063 Jugar respeta el limite maximo de paginacion de sesiones', () => {
  assert.match(source, /chronicleGateway\.sessions\(chronicleId, \{ limit: 50, offset: 0 \}\)/)
  assert.doesNotMatch(source, /chronicleGateway\.sessions\(chronicleId, \{ limit: 100, offset: 0 \}\)/)
})

test('SPEC-063 Jugar muestra el fallo de carga y permite reintentar', () => {
  assert.match(source, /No se pudieron cargar las sesiones/)
  assert.match(source, /Reintentar carga de sesiones/)
})
