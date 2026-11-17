import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { parseChronicleCharacterCorrectionRequest } from '../dist/characters/presentation/character-draft.dto.js'

const id = '01234567-89ab-4cde-8123-456789abcdef'

test('correction request accepts only point and advantage sections plus audit reason', () => {
  const request = parseChronicleCharacterCorrectionRequest(id, {
    expectedRevision: 7,
    reason: 'Se corrige un error de creación',
    attributes: { strength: 3 },
    skills: { athletics: 2 },
    advantages: { selections: [{
      selectionId: 'merit-1', definitionKey: 'contacts', category: 'background',
      rating: 1, origin: 'narratorCorrection', parentSelectionId: null, details: null,
    }] },
  })
  assert.equal(request.characterId, id)
  assert.equal(request.expectedRevision, 7)
  assert.equal(request.reason, 'Se corrige un error de creación')
  assert.deepEqual(request.attributes, { strength: 3 })
  assert.deepEqual(request.skills, { athletics: 2 })
})

test('correction route and transaction keep authorization and audit on the server', async () => {
  const controller = await readFile(new URL('../src/characters/presentation/chronicle-character.controller.ts', import.meta.url), 'utf8')
  const repository = await readFile(new URL('../src/characters/infrastructure/prisma-character-draft.repository.ts', import.meta.url), 'utf8')
  assert.match(controller, /@Patch\(':chronicleId\/characters\/:characterId\/correction'\)/)
  assert.match(repository, /role: 'NARRATOR',[\s\S]*status: 'ACTIVE'/)
  assert.match(repository, /transaction\.characterCorrectionAudit\.create/)
  assert.match(repository, /revision: data\.expectedRevision/)
})

test('correction parser rejects experience and operational state fields', () => {
  assert.throws(() => parseChronicleCharacterCorrectionRequest(id, {
    expectedRevision: 1,
    reason: 'Corrección solicitada',
    experience: { total: 99 },
  }))
  assert.throws(() => parseChronicleCharacterCorrectionRequest(id, {
    expectedRevision: 1,
    reason: 'Corrección solicitada',
    blood: { hunger: 0 },
  }))
})
