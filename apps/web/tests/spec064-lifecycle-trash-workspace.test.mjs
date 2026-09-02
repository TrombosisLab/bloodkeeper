import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const hub = fs.readFileSync(new URL('../src/features/administration/components/AdministrationHub.tsx', import.meta.url), 'utf8')
const panel = fs.readFileSync(new URL('../src/features/administration/components/LifecycleTrashPanel.tsx', import.meta.url), 'utf8')
const gateway = fs.readFileSync(new URL('../src/features/administration/infrastructure/lifecycle-trash.api.ts', import.meta.url), 'utf8')

test('SPEC-064 añade Archivo y papelera al centro administrativo', () => {
  assert.match(hub, /Archivo y papelera/)
  assert.match(hub, /LifecycleTrashPanel/)
  assert.match(panel, /Dependencias/)
  assert.match(panel, /Restaurar/)
  assert.match(panel, /Eliminar definitivamente/)
  assert.match(panel, /Actualizado desde/)
  assert.match(panel, /Actualizado hasta/)
  assert.match(panel, /lifecycle-trash__counts/)
})

test('SPEC-064 Web usa rutas administrativas y confirmación nominal', () => {
  assert.match(gateway, /\/api\/administration\/lifecycle\/trash/)
  assert.match(gateway, /method: 'PATCH'/)
  assert.match(gateway, /method: 'DELETE'/)
  assert.match(panel, /Escribe exactamente:/)
})
