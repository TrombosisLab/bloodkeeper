import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DiceApiError,
  createDiceGateway,
  diceHistoryEndpoint,
  parseDiceRollHistoryItem,
  parseDiceRollHistoryPage,
} from '../src/features/dice/infrastructure/dice.api.ts'

function historyItem(overrides = {}) {
  return {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    actorId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    actorDisplayName: 'Trombosis',
    characterId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    chronicleId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    sessionId: null,
    rerollParentId: null,
    source: 'character',
    visibility: 'contextual',
    description: 'Acechar',
    rulesVersion: 'v5r-spec-038-v1',
    createdAt: '2026-08-11T20:00:00.000Z',
    pool: {
      components: [{ key: 'dexterity', label: 'Destreza', value: 3 }],
      modifiers: [],
      basePool: 3,
      modifier: 0,
      finalPool: 3,
      normalDice: 2,
      hungerDice: 1,
      difficulty: 2,
      context: { source: 'character', description: 'Acechar' },
    },
    roll: {
      dice: [
        { value: 6, type: 'normal', isSuccess: true, isCriticalTen: false, isBestialFailureDie: false },
        { value: 10, type: 'hunger', isSuccess: true, isCriticalTen: true, isBestialFailureDie: false },
      ],
      difficulty: 2,
      regularSuccesses: 2,
      criticalPairs: 0,
      criticalBonusSuccesses: 0,
      totalSuccesses: 2,
      isSuccessful: true,
      specialResult: 'none',
      specialEvidence: {
        criticalTenIndices: [1],
        hungerCriticalTenIndices: [1],
        criticalPairs: [],
        bestialFailureDieIndices: [],
      },
      outcome: 'success',
      meetsDifficulty: true,
    },
    ...overrides,
  }
}

test('039-C conserva metadatos y snapshots historicos sin recalculo', () => {
  const parsed = parseDiceRollHistoryItem(historyItem())
  assert.equal(parsed.actorDisplayName, 'Trombosis')
  assert.equal(parsed.pool.finalPool, 3)
  assert.equal(parsed.roll.dice[1].type, 'hunger')
  assert.equal(parsed.createdAt, '2026-08-11T20:00:00.000Z')
})

test('039-C valida pagina y cursor opaco del backend', () => {
  const page = parseDiceRollHistoryPage({
    items: [historyItem()],
    nextCursor: 'cursor-opaco',
  })
  assert.equal(page.items.length, 1)
  assert.equal(page.nextCursor, 'cursor-opaco')
})

test('039-C construye filtros utiles sin exponer offset', () => {
  assert.equal(
    diceHistoryEndpoint({
      chronicleId: 'chronicle-id',
      source: 'manual',
      description: 'noche roja',
      limit: 10,
      cursor: 'cursor',
    }),
    '/api/dice/history?chronicleId=chronicle-id&source=manual&description=noche+roja&cursor=cursor&limit=10',
  )
})

test('039-C gateway consulta listado y detalle con credenciales', async () => {
  const calls = []
  const gateway = createDiceGateway(async (url, init) => {
    calls.push({ url, init })
    const body = String(url).includes('/detail%2Fid')
      ? historyItem()
      : { items: [historyItem()], nextCursor: null }
    return new Response(JSON.stringify(body), { status: 200 })
  })
  await gateway.history({ characterId: 'character-id', limit: 10 })
  await gateway.historyDetail('detail/id')
  assert.equal(calls[0].url, '/api/dice/history?characterId=character-id&limit=10')
  assert.equal(calls[0].init.method, 'GET')
  assert.equal(calls[0].init.credentials, 'include')
  assert.equal(calls[1].url, '/api/dice/history/detail%2Fid')
})

test('039-C rechaza metadatos o fechas historicas incompletas', () => {
  assert.throws(
    () => parseDiceRollHistoryItem(historyItem({ createdAt: 'no-date' })),
    (error) => error instanceof DiceApiError && error.status === 502,
  )
  assert.throws(
    () => parseDiceRollHistoryPage({ items: {}, nextCursor: null }),
    DiceApiError,
  )
})
