import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  InvalidCharacterAdvancementRequestError,
  parseCharacterAdvancementPurchase,
} from '../dist/characters/presentation/character-advancement.dto.js'

const controller = readFileSync(new URL('../src/characters/presentation/character-advancement.controller.ts', import.meta.url), 'utf8')
const repository = readFileSync(new URL('../src/characters/infrastructure/prisma-character-experience.repository.ts', import.meta.url), 'utf8')

test('056-D expone compra revisionada sin aceptar coste de UI', () => {
  const parsed = parseCharacterAdvancementPurchase({ expectedRevision: 3, operationId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', advancement: { kind: 'skill', key: 'academics' } }, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')
  assert.equal(parsed.expectedRevision, 3)
  assert.throws(() => parseCharacterAdvancementPurchase({ expectedRevision: 3, operationId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', advancement: { kind: 'skill', key: 'academics', cost: 1 } }, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'), InvalidCharacterAdvancementRequestError)
  assert.match(controller, /@Post\('purchase'\)/)
})

test('056-D bloquea fila y une mutacion revision y SPEND en una transaccion', () => {
  assert.match(repository, /\$transaction/)
  assert.match(repository, /FOR UPDATE/)
  assert.match(repository, /character\.revision !== data\.expectedRevision/)
  assert.match(repository, /PrismaCharacterExperienceMovementType\.SPEND/)
  assert.match(repository, /PrismaCharacterExperienceComponent\.SPENT/)
  assert.match(repository, /applyAdvancementMutation/)
  assert.match(repository, /revision: \{ increment: 1 \}/)
  assert.match(repository, /ledger\.available < data\.cost/)
})
