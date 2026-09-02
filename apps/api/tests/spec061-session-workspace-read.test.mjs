import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
const controller = readFileSync(new URL('../src/chronicles/presentation/chronicle-session-workspace.controller.ts', import.meta.url), 'utf8')
const useCase = readFileSync(new URL('../src/chronicles/application/load-chronicle-session-workspace.use-case.ts', import.meta.url), 'utf8')
test('SPEC-061-B3 publica lectura privada del workspace de Sesion', () => {
  assert.equal(controller.includes("chronicles/:chronicleId/sessions/:sessionId/workspace"), true)
  assert.equal(controller.includes('@Get()'), true)
  assert.equal(controller.includes('CHRONICLE_SESSION_PERMISSION_DENIED'), true)
})
test('SPEC-061-B3 deriva orden y progreso desde datos persistidos', () => {
  assert.equal(useCase.includes('chronicleSessionScene.findMany'), true)
  assert.equal(useCase.includes('chronicleSessionPreparationItem.findMany'), true)
  assert.equal(useCase.includes('Math.round'), true)
  assert.equal(useCase.includes("sortOrder: 'asc'"), true)
})
