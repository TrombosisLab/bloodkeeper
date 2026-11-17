import test from 'node:test'
import assert from 'node:assert/strict'

import {
  CharacterCorrectionConflictError,
  CharacterCorrectionRuleViolationError,
  CorrectChronicleCharacterUseCase,
} from '../src/characters/application/correct-chronicle-character.use-case.ts'

const character = {
  characterId: 'character-id',
  ownerId: 'owner-id',
  chronicleId: 'chronicle-id',
  status: 'active',
  revision: 4,
  attributes: { strength: 2 },
  skills: { athletics: 1 },
  disciplines: [],
  advantages: { selections: [] },
}

test('narrator correction delegates only the requested domains with audit context', async () => {
  const writes = []
  const useCase = new CorrectChronicleCharacterUseCase(
    { execute: async () => character },
    { correctByNarrator: async (...args) => { writes.push(args); return character } },
    { validate: () => ({ issues: [] }) },
  )

  await useCase.execute('narrator-id', 'chronicle-id', 'character-id', {
    expectedRevision: 4,
    reason: 'Corrección acordada con el jugador',
    attributes: { strength: 3 },
    advantages: { selections: [] },
  })

  assert.equal(writes.length, 1)
  assert.equal(writes[0][0], 'owner-id')
  assert.deepEqual(writes[0][1], {
    characterId: 'character-id',
    expectedRevision: 4,
    attributes: { strength: 3 },
    advantages: { selections: [] },
  })
  assert.deepEqual(writes[0][2], {
    actorId: 'narrator-id',
    chronicleId: 'chronicle-id',
    reason: 'Corrección acordada con el jugador',
  })
})

test('narrator correction rejects a stale character revision', async () => {
  const useCase = new CorrectChronicleCharacterUseCase(
    { execute: async () => character },
    { correctByNarrator: async () => assert.fail('must not write') },
    { validate: () => ({ issues: [] }) },
  )
  await assert.rejects(useCase.execute('n', 'c', 'x', {
    expectedRevision: 3,
    reason: 'Motivo válido',
    skills: { athletics: 2 },
  }), CharacterCorrectionConflictError)
})

test('narrator correction rejects invalid edited domains before persistence', async () => {
  const useCase = new CorrectChronicleCharacterUseCase(
    { execute: async () => character },
    { correctByNarrator: async () => assert.fail('must not write') },
    { validate: () => ({ issues: [{ section: 'attributes', severity: 'error', code: 'INVALID' }] }) },
  )
  await assert.rejects(useCase.execute('n', 'c', 'x', {
    expectedRevision: 4,
    reason: 'Motivo válido',
    attributes: { strength: 9 },
  }), CharacterCorrectionRuleViolationError)
})
