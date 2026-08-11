import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CharacterExperienceApiError,
  createCharacterExperienceGateway,
} from '../src/features/character-sheet/infrastructure/character-experience.api.ts'

const characterId = '39c1801e-68fe-4c92-8795-723cac284bdf'

function ledger() {
  return {
    characterId,
    total: 15,
    spent: 5,
    available: 10,
    movements: [{
      id: '1196beae-5c3c-4de6-aadb-20e2eaf49e63',
      characterId,
      actorId: '3bbc46f8-a45f-4589-9872-129e6652082c',
      sessionId: null,
      type: 'grant',
      component: 'earned',
      amount: 15,
      reason: 'story_end',
      acquisitionType: null,
      acquisitionKey: null,
      correctsMovementId: null,
      createdAt: '2026-08-11T09:00:00.000Z',
    }],
  }
}

function preview() {
  return {
    characterId,
    revision: 7,
    kind: 'attribute',
    key: 'strength',
    currentRating: 1,
    newRating: 2,
    cost: 10,
    available: 10,
    eligible: true,
    issues: [],
    consequences: [],
  }
}

test('056-E carga saldo e historial mecánico autenticado', async () => {
  const calls = []
  const gateway = createCharacterExperienceGateway(async (url, init) => {
    calls.push({ url, init })
    return new Response(JSON.stringify(ledger()), { status: 200 })
  })
  const result = await gateway.load(characterId)
  assert.equal(result.available, 10)
  assert.equal(result.movements.length, 1)
  assert.equal(calls[0].url, `/api/characters/${characterId}/experience`)
  assert.equal(calls[0].init.credentials, 'include')
})

test('056-E previsualiza sin enviar coste desde la interfaz', async () => {
  let request
  const gateway = createCharacterExperienceGateway(async (_url, init) => {
    request = JSON.parse(init.body)
    return new Response(JSON.stringify(preview()), { status: 200 })
  })
  const result = await gateway.preview(characterId, { kind: 'attribute', key: 'strength' })
  assert.equal(result.cost, 10)
  assert.deepEqual(request, { kind: 'attribute', key: 'strength' })
  assert.equal(Object.hasOwn(request, 'cost'), false)
})

test('056-E confirma con revisión, idempotencia y la misma mejora', async () => {
  let request
  const gateway = createCharacterExperienceGateway(async (url, init) => {
    assert.equal(url, `/api/characters/${characterId}/experience/purchase`)
    request = JSON.parse(init.body)
    return new Response(JSON.stringify({ experience: ledger(), preview: preview() }), { status: 200 })
  })
  const operationId = 'f4f29e5d-9a65-49db-8bfa-9f7bd0dd25d2'
  const result = await gateway.purchase(characterId, 7, operationId, { kind: 'attribute', key: 'strength' })
  assert.equal(result.experience.spent, 5)
  assert.deepEqual(request, {
    expectedRevision: 7,
    operationId,
    advancement: { kind: 'attribute', key: 'strength' },
  })
  assert.equal(Object.hasOwn(request, 'cost'), false)
})

test('056-E conserva errores estructurados del backend', async () => {
  const gateway = createCharacterExperienceGateway(async () => new Response(
    JSON.stringify({ code: 'CHARACTER_REVISION_CONFLICT' }),
    { status: 409 },
  ))
  await assert.rejects(
    gateway.load(characterId),
    (error) => error instanceof CharacterExperienceApiError &&
      error.status === 409 && error.code === 'CHARACTER_REVISION_CONFLICT',
  )
})
