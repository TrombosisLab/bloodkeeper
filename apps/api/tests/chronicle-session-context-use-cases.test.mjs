import assert from 'node:assert/strict'
import test from 'node:test'

import { LoadChronicleSessionContextUseCase } from '../dist/chronicles/application/load-chronicle-session-context.use-case.js'
import { ReplaceChronicleSessionContextUseCase } from '../dist/chronicles/application/replace-chronicle-session-context.use-case.js'
import { ChronicleSessionPermissionError } from '../dist/chronicles/application/chronicle-session-permission.js'

const actorId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const chronicleId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const sessionId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const context = {
  sessionId,
  events: [],
  npcs: [],
  locations: [],
  resources: [
    { id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', kind: 'document', name: 'Pista pública', summary: null, status: 'active', visibility: 'chronicle_participants' },
    { id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', kind: 'artifact', name: 'Secreto', summary: null, status: 'active', visibility: 'narrator_only' },
  ],
}

function participants(role = 'narrator') {
  return { async findActiveMembership() { return role === null ? null : { role } } }
}

function repository() {
  return {
    async findBySessionId(receivedChronicleId, receivedSessionId) {
      assert.equal(receivedChronicleId, chronicleId)
      assert.equal(receivedSessionId, sessionId)
      return context
    },
    async replace(data) { return { ...context, resourceIds: data.resourceIds ?? [] } },
  }
}

test('SPEC-069 Narrador consulta el contexto completo de la mesa', async () => {
  const useCase = new LoadChronicleSessionContextUseCase(repository(), participants())
  assert.deepEqual(await useCase.execute(actorId, chronicleId, sessionId), context)
})

test('SPEC-069 participante consulta contexto público y no recibe recursos privados', async () => {
  const useCase = new LoadChronicleSessionContextUseCase(repository(), participants('player'))
  const loaded = await useCase.execute(actorId, chronicleId, sessionId)
  assert.deepEqual(loaded.resources.map((resource) => resource.name), ['Pista pública'])
})

test('SPEC-069 usuario ajeno no consulta contexto y jugador no lo reemplaza', async () => {
  const load = new LoadChronicleSessionContextUseCase(repository(), participants(null))
  await assert.rejects(() => load.execute(actorId, chronicleId, sessionId), ChronicleSessionPermissionError)

  const replace = new ReplaceChronicleSessionContextUseCase(repository(), participants('player'))
  await assert.rejects(() => replace.execute(actorId, {
    chronicleId,
    sessionId,
    eventIds: [],
    npcIds: [],
    locationIds: [],
    resourceIds: [],
  }), ChronicleSessionPermissionError)
})
