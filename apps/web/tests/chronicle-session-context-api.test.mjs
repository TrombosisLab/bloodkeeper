import assert from 'node:assert/strict'
import test from 'node:test'

import { createChronicleGateway } from '../src/features/chronicles/infrastructure/chronicle.api.ts'

function response(body) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
}

const legacyContext = {
  sessionId: 'session-1',
  events: [{ id: 'event-1', title: 'Llegada al Elíseo', status: 'active', narrativeTimeLabel: 'Primera noche', realDate: null, timelineOrder: 0 }],
  npcs: [{ id: 'npc-1', name: 'Príncipe', status: 'active', category: 'Vástago', narrativeRole: 'Autoridad' }],
  locations: [{ id: 'location-1', name: 'Elíseo', status: 'active', category: 'Refugio neutral', parentLocationId: null }],
}

test('SPEC-069 mantiene compatibilidad con contexto anterior sin resources', async () => {
  const gateway = createChronicleGateway(async () => response(legacyContext))
  const loaded = await gateway.sessionContext('chronicle-1', 'session-1')
  assert.deepEqual(loaded, { ...legacyContext, resources: [] })
})

test('SPEC-069 analiza recursos compartidos de sesión', async () => {
  const resource = { id: 'resource-1', kind: 'document', name: 'Carta', summary: 'Una pista', status: 'active', visibility: 'chronicle_participants' }
  const gateway = createChronicleGateway(async () => response({ ...legacyContext, resources: [resource] }))
  const loaded = await gateway.sessionContext('chronicle-1', 'session-1')
  assert.deepEqual(loaded.resources, [resource])
})

test('SPEC-069 conserva PATCH completo y rechaza recursos inválidos', async () => {
  const calls = []
  const gateway = createChronicleGateway(async (url, init) => {
    calls.push([url, init])
    return response({ ...legacyContext, resources: [] })
  })
  const request = { eventIds: ['event-1'], npcIds: ['npc-1'], locationIds: ['location-1'], resourceIds: ['resource-1'] }
  await gateway.replaceSessionContext('chronicle-1', 'session-1', request)
  assert.equal(calls[0][1].method, 'PATCH')
  assert.deepEqual(JSON.parse(calls[0][1].body), request)

  const invalid = createChronicleGateway(async () => response({ ...legacyContext, resources: [{ id: 'x', kind: 'private', name: 'x', summary: null, status: 'active', visibility: 'narrator_only' }] }))
  await assert.rejects(invalid.sessionContext('chronicle-1', 'session-1'), (error) => error.code === 'INVALID_CHRONICLE_RESPONSE')
})
