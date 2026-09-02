import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const controller = fs.readFileSync(new URL('../src/administration/lifecycle-trash.controller.ts', import.meta.url), 'utf8')
const service = fs.readFileSync(new URL('../src/administration/lifecycle-trash.service.ts', import.meta.url), 'utf8')
const moduleSource = fs.readFileSync(new URL('../src/administration/system-operations.module.ts', import.meta.url), 'utf8')

test('SPEC-064 registra consulta, dependencias, restauración y purga administrativas', () => {
  assert.match(controller, /@Controller\('administration\/lifecycle\/trash'\)/)
  assert.match(controller, /@Get\(':kind\/:id\/dependencies'\)/)
  assert.match(controller, /@Patch\(':kind\/:id\/restore'\)/)
  assert.match(controller, /@Delete\(':kind\/:id'\)/)
  assert.match(controller, /roles\.includes\('admin'\)/)
  assert.match(moduleSource, /LifecycleTrashController/)
  assert.match(moduleSource, /LifecycleTrashService/)
  assert.match(moduleSource, /imports: \[DatabaseModule\]/)
})

test('SPEC-064 protege historia inmutable y exige confirmación exacta', () => {
  assert.match(service, /characterExperienceMovement\.count/)
  assert.match(service, /diceRollRecord\.count/)
  assert.match(service, /ChronicleSessionStatus\.COMPLETED/)
  assert.match(service, /confirmation !== dependencies\.label/)
  assert.match(service, /Cuenta fundamental protegida/)
  assert.match(service, /experiencePaceSnapshot/)
  assert.match(service, /completedAt/)
  assert.match(service, /lifecycleTrashKinds\.map/)
  assert.match(service, /\$transaction/)
})
