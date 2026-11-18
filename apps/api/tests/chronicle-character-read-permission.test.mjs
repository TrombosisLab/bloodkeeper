import test from 'node:test'
import assert from 'node:assert/strict'

import {
  ChronicleCharacterNotFoundError,
  ChronicleCharacterReadPermissionError,
  LoadChronicleCharacterUseCase,
} from '../dist/characters/application/load-chronicle-character.use-case.js'

const character = {
  characterId: 'character-id',
  ownerId: 'player-id',
  chronicleId: 'chronicle-id',
  status: 'active',
}

test('active player can read their own character in the chronicle', async () => {
  const calls = []
  const useCase = new LoadChronicleCharacterUseCase(
    { findByCharacterId: async (id) => { calls.push(['character', id]); return character } },
    { findActiveMembership: async (...args) => { calls.push(['membership', ...args]); return { role: 'player' } } },
  )

  assert.equal(await useCase.execute('player-id', 'chronicle-id', 'character-id'), character)
  assert.deepEqual(calls, [
    ['membership', 'chronicle-id', 'player-id'],
    ['character', 'character-id'],
  ])
})

test('active player cannot read another participant character', async () => {
  const useCase = new LoadChronicleCharacterUseCase(
    { findByCharacterId: async () => ({ ...character, ownerId: 'other-player-id' }) },
    { findActiveMembership: async () => ({ role: 'player' }) },
  )

  await assert.rejects(
    useCase.execute('player-id', 'chronicle-id', 'character-id'),
    ChronicleCharacterReadPermissionError,
  )
})

test('active narrator can read another participant character', async () => {
  const otherCharacter = { ...character, ownerId: 'other-player-id' }
  const useCase = new LoadChronicleCharacterUseCase(
    { findByCharacterId: async () => otherCharacter },
    { findActiveMembership: async () => ({ role: 'narrator' }) },
  )

  assert.equal(await useCase.execute('narrator-id', 'chronicle-id', 'character-id'), otherCharacter)
})

test('inactive or non-member requester is rejected before looking up a character', async () => {
  let lookups = 0
  const useCase = new LoadChronicleCharacterUseCase(
    { findByCharacterId: async () => { lookups += 1; return character } },
    { findActiveMembership: async () => null },
  )

  await assert.rejects(
    useCase.execute('player-id', 'chronicle-id', 'character-id'),
    ChronicleCharacterReadPermissionError,
  )
  assert.equal(lookups, 0)
})

test('character linked to a different chronicle is still not found', async () => {
  const useCase = new LoadChronicleCharacterUseCase(
    { findByCharacterId: async () => ({ ...character, chronicleId: 'different-chronicle-id' }) },
    { findActiveMembership: async () => ({ role: 'narrator' }) },
  )

  await assert.rejects(
    useCase.execute('narrator-id', 'chronicle-id', 'character-id'),
    ChronicleCharacterNotFoundError,
  )
})
