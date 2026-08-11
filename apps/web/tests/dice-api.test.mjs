import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DiceApiError,
  createDiceGateway,
} from '../src/features/dice/infrastructure/dice.api.ts'

function response() {
  return {
    pool: {
      components: [{ key: 'manual_pool', label: 'Reserva manual', value: 3 }],
      modifiers: [],
      basePool: 3,
      modifier: 0,
      finalPool: 3,
      normalDice: 2,
      hungerDice: 1,
      difficulty: 2,
      context: { source: 'manual', description: null },
    },
    roll: {
      dice: [
        { value: 6, type: 'normal', isSuccess: true, isCriticalTen: false, isBestialFailureDie: false },
        { value: 4, type: 'normal', isSuccess: false, isCriticalTen: false, isBestialFailureDie: false },
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
        criticalTenIndices: [2],
        hungerCriticalTenIndices: [2],
        criticalPairs: [],
        bestialFailureDieIndices: [],
      },
      outcome: 'success',
      meetsDifficulty: true,
    },
  }
}

test('036-D ejecuta tirada manual autenticada', async () => {
  const calls = []
  const gateway = createDiceGateway(async (url, init) => {
    calls.push({ url, init })
    return new Response(JSON.stringify(response()), { status: 200 })
  })
  const result = await gateway.manual({ pool: 3, hunger: 1, difficulty: 2 })
  assert.equal(result.roll.totalSuccesses, 2)
  assert.equal(calls[0].url, '/api/dice/manual')
  assert.equal(calls[0].init.credentials, 'include')
  assert.deepEqual(JSON.parse(calls[0].init.body), { pool: 3, hunger: 1, difficulty: 2 })
})

test('036-D ejecuta tirada de personaje sin enviar puntuaciones ni Hambre', async () => {
  let request
  const gateway = createDiceGateway(async (url, init) => {
    request = { url, body: JSON.parse(init.body) }
    return new Response(JSON.stringify(response()), { status: 200 })
  })
  await gateway.character('character-1', {
    attribute: 'dexterity',
    skill: 'stealth',
    modifier: 1,
  })
  assert.equal(request.url, '/api/dice/characters/character-1')
  assert.deepEqual(request.body, {
    attribute: 'dexterity',
    skill: 'stealth',
    modifier: 1,
  })
  assert.equal(Object.hasOwn(request.body, 'hunger'), false)
  assert.equal(Object.hasOwn(request.body, 'pool'), false)
})

test('036-D conserva dados normales y de Hambre individualmente', async () => {
  const gateway = createDiceGateway(async () =>
    new Response(JSON.stringify(response()), { status: 200 }))
  const result = await gateway.manual({ pool: 3, hunger: 1 })
  assert.deepEqual(result.roll.dice.map((die) => die.type), [
    'normal', 'normal', 'hunger',
  ])
})

test('036-D conserva errores estructurados del backend', async () => {
  const gateway = createDiceGateway(async () => new Response(
    JSON.stringify({ code: 'DICE_ROLL_RULE_VIOLATION' }),
    { status: 422 },
  ))
  await assert.rejects(
    gateway.manual({ pool: 0, hunger: 0 }),
    (error) => error instanceof DiceApiError &&
      error.status === 422 &&
      error.code === 'DICE_ROLL_RULE_VIOLATION',
  )
})

test('036-D rechaza respuestas incompletas', async () => {
  const gateway = createDiceGateway(async () =>
    new Response(JSON.stringify({ pool: {} }), { status: 200 }))
  await assert.rejects(
    gateway.manual({ pool: 3, hunger: 1 }),
    (error) => error instanceof DiceApiError && error.status === 502,
  )
})
