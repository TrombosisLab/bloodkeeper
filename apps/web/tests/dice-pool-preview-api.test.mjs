import assert from 'node:assert/strict'
import test from 'node:test'

import {
  DiceApiError,
  createDiceGateway,
  parseDicePool,
} from '../src/features/dice/infrastructure/dice.api.ts'

function pool() {
  return {
    components: [
      { key: 'attribute:dexterity', label: 'dexterity', value: 3 },
      { key: 'skill:stealth', label: 'stealth', value: 2 },
    ],
    modifiers: [
      { key: 'darkness', label: 'Oscuridad', value: -1 },
    ],
    basePool: 5,
    modifier: -1,
    finalPool: 4,
    normalDice: 2,
    hungerDice: 2,
    difficulty: 3,
    context: {
      source: 'character',
      description: 'Cruzar sin ser visto',
    },
  }
}

test('037-C solicita preview manual autenticada antes de ejecutar', async () => {
  const calls = []
  const gateway = createDiceGateway(async (url, init) => {
    calls.push({ url, init })
    return new Response(JSON.stringify({
      ...pool(),
      context: { source: 'manual', description: 'Buscar una salida' },
    }), { status: 200 })
  })
  const result = await gateway.previewManual({
    pool: 5,
    hunger: 2,
    description: 'Buscar una salida',
  })

  assert.equal(calls[0].url, '/api/dice/manual/preview')
  assert.equal(calls[0].init.credentials, 'include')
  assert.equal(result.finalPool, 4)
})

test('037-C solicita preview de personaje sin enviar puntuaciones', async () => {
  let request
  const gateway = createDiceGateway(async (url, init) => {
    request = { url, body: JSON.parse(init.body) }
    return new Response(JSON.stringify(pool()), { status: 200 })
  })
  await gateway.previewCharacter('character-1', {
    attribute: 'dexterity',
    skill: 'stealth',
    modifiers: [
      { key: 'darkness', label: 'Oscuridad', value: -1 },
    ],
  })

  assert.equal(
    request.url,
    '/api/dice/characters/character-1/preview',
  )
  assert.equal(Object.hasOwn(request.body, 'pool'), false)
  assert.equal(Object.hasOwn(request.body, 'hunger'), false)
})

test('037-C valida componentes modificadores contexto y totales', () => {
  const result = parseDicePool(pool())
  assert.equal(result.components.length, 2)
  assert.equal(result.modifiers[0].label, 'Oscuridad')
  assert.equal(result.context.description, 'Cruzar sin ser visto')
  assert.equal(result.finalPool, 4)

  assert.throws(
    () => parseDicePool({ ...pool(), modifiers: undefined }),
    (error) => error instanceof DiceApiError && error.status === 502,
  )
})
