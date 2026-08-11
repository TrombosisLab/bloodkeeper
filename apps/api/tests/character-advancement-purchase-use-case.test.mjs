import assert from 'node:assert/strict'
import test from 'node:test'
import {
  PurchaseCharacterAdvancementUseCase,
} from '../dist/characters/application/purchase-character-advancement.use-case.js'

const ownerId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const characterId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const operationId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const character = {
  characterId, ownerId, chronicleId: null, status: 'active', revision: 7, createdAt: new Date(), updatedAt: new Date(),
  identity: { clanKey: 'tremere', generation: 13 }, attributes: { strength: 2 }, skills: { academics: 2 }, skillSpecialties: [],
  disciplines: [], bloodSorceryRituals: { ritualKeys: [] }, oblivionCeremonies: { ceremonyKeys: [] }, thinBloodAlchemy: { rating: 0, formulaKeys: [] },
  advantages: { selections: [] }, blood: { bloodPotency: 1 },
}

test('056-D valida evolution y delega una unica compra atomica', async () => {
  let calls = 0
  const drafts = { async findById() { return calls === 0 ? character : { ...character, revision: 8, attributes: { strength: 3 } } } }
  const experience = {
    async findCharacter() { return { id: characterId, ownerId, chronicleId: null, status: 'active' } },
    async loadLedger() { return { characterId, total: 20, spent: 0, available: 20, movements: [] } },
    async purchase(data) { calls += 1; assert.equal(data.cost, 15); assert.equal(data.expectedRevision, 7); return { characterId, total: 20, spent: 15, available: 5, movements: [] } },
  }
  const validator = { validate(value, context) { assert.equal(value.attributes.strength, 3); assert.equal(context, 'evolution'); return { context, valid: true, canProceed: true, sections: [], issues: [] } } }
  const useCase = new PurchaseCharacterAdvancementUseCase(drafts, experience, {}, validator)
  const result = await useCase.execute(ownerId, { characterId, expectedRevision: 7, operationId, advancement: { kind: 'attribute', key: 'strength' } })
  assert.equal(calls, 1)
  assert.equal(result.experience.available, 5)
  assert.equal(result.character.revision, 8)
})
