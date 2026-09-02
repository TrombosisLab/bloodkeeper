import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ApplyCharacterBloodResonanceUseCase,
  CharacterBloodResonancePermissionError,
} from '../dist/characters/application/apply-character-blood-resonance.use-case.js'

const characterId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const ownerId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const narratorId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const outsiderId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
const chronicleId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'

function character() {
  return {
    characterId,
    ownerId,
    chronicleId,
    status: 'active',
    nature: 'vampire',
    revision: 4,
    blood: { bloodPotency: 1, hunger: 5, resonance: null },
  }
}

function command(operationId) {
  return {
    characterId,
    expectedRevision: 4,
    operationId,
    sourceKind: 'human',
    resonanceKey: 'choleric',
    specialAffinityKey: null,
    temperament: 'fleeting',
    dyscrasiaKey: null,
    dyscrasiaAcquisitionMode: null,
    hungerSlaked: 1,
  }
}

function repository() {
  return {
    async findByCharacterId() { return character() },
    async findBloodResonanceOperation() { return null },
    async applyBloodResonance() {
      return { ...character(), revision: 5, blood: { bloodPotency: 1, hunger: 4, resonance: null } }
    },
  }
}

test('SPEC-068 permite alimentarse al propietario aunque esté en una crónica', async () => {
  let membershipQueries = 0
  const useCase = new ApplyCharacterBloodResonanceUseCase(repository(), {
    async findActiveMembership() {
      membershipQueries += 1
      return null
    },
  })
  const result = await useCase.execute(ownerId, command('11111111-1111-4111-8111-111111111111'))
  assert.equal(result.blood.hunger, 4)
  assert.equal(membershipQueries, 0)
})

test('SPEC-068 mantiene acceso del Narrador y rechaza a terceros', async () => {
  const participants = {
    async findActiveMembership(_chronicleId, actorId) {
      return actorId === narratorId ? { role: 'narrator' } : { role: 'player' }
    },
  }
  const narratorUseCase = new ApplyCharacterBloodResonanceUseCase(repository(), participants)
  const result = await narratorUseCase.execute(narratorId, command('22222222-2222-4222-8222-222222222222'))
  assert.equal(result.blood.hunger, 4)

  const outsiderUseCase = new ApplyCharacterBloodResonanceUseCase(repository(), participants)
  await assert.rejects(
    outsiderUseCase.execute(outsiderId, command('33333333-3333-4333-8333-333333333333')),
    CharacterBloodResonancePermissionError,
  )
})
