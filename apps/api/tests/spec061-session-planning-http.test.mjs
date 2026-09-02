import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const dto = readFileSync(new URL('../src/chronicles/presentation/chronicle-session.dto.ts', import.meta.url), 'utf8')
const repository = readFileSync(new URL('../src/chronicles/infrastructure/prisma-chronicle-session.repository.ts', import.meta.url), 'utf8')

test('SPEC-061-B2 expone objetivo y resumen previsto en creacion y edicion', () => {
  assert.match(dto, /'objective'/)
  assert.match(dto, /'plannedSummary'/)
  assert.match(dto, /body.objective/)
  assert.match(dto, /body.plannedSummary/)
})

test('SPEC-061-B2 persiste planificacion e incrementa revision', () => {
  assert.match(repository, /objective: data.objective/)
  assert.match(repository, /plannedSummary: data.plannedSummary/)
  assert.match(repository, /revision: { increment: 1 }/)
})
