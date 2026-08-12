import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  ListDiceRollHistoryUseCase,
  LoadDiceRollHistoryUseCase,
} from '../dist/dice/application/dice-history.use-cases.js'
import {
  DiceRollContextMismatchError,
  DiceRollContextPermissionError,
} from '../dist/dice/application/dice-roll-context.js'

function repository(options = {}) {
  const calls = []
  return {
    calls,
    async findCharacterContext(id) {
      return options.character ?? { ownerId: 'owner-1', chronicleId: 'chronicle-1' }
    },
    async list(query) {
      calls.push(query)
      return { items: [], nextCursor: null }
    },
    async findById() {
      return options.record ?? null
    },
  }
}

function participants(role = 'player', active = true) {
  return {
    async findActiveMembership(chronicleId, userId) {
      return active
        ? { chronicleId, userId, role, status: 'active' }
        : null
    },
  }
}

function sessions(found = true) {
  return {
    async findById(chronicleId, id) {
      return found ? { id, chronicleId } : null
    },
  }
}

const base = { limit: 20, cursor: null }

test('039-B2 limita el historial sin contexto al propio ejecutor', async () => {
  const records = repository()
  const useCase = new ListDiceRollHistoryUseCase(
    records, participants(), sessions(),
  )
  await useCase.execute('viewer-1', base)
  assert.equal(records.calls[0].accessScope, 'actor')
  assert.equal(records.calls[0].viewerId, 'viewer-1')
  await assert.rejects(
    useCase.execute('viewer-1', { ...base, actorId: 'other' }),
    DiceRollContextPermissionError,
  )
})

test('039-B2 permite al participante solo visibilidad contextual de cronica', async () => {
  const records = repository()
  const useCase = new ListDiceRollHistoryUseCase(
    records, participants('player'), sessions(),
  )
  await useCase.execute('viewer-1', {
    ...base,
    chronicleId: 'chronicle-1',
  })
  assert.equal(records.calls[0].accessScope, 'participant')
})

test('039-B2 permite al Narrador activo consultar privadas contextuales', async () => {
  const records = repository()
  const useCase = new ListDiceRollHistoryUseCase(
    records, participants('narrator'), sessions(),
  )
  await useCase.execute('narrator-1', {
    ...base,
    chronicleId: 'chronicle-1',
  })
  assert.equal(records.calls[0].accessScope, 'narrator')
})

test('039-B2 protege historial de personaje por propietario o Narrador', async () => {
  const ownerRecords = repository()
  const owner = new ListDiceRollHistoryUseCase(
    ownerRecords, participants(), sessions(),
  )
  await owner.execute('owner-1', {
    ...base,
    characterId: 'character-1',
  })
  assert.equal(ownerRecords.calls[0].accessScope, 'actor')

  const narratorRecords = repository()
  const narrator = new ListDiceRollHistoryUseCase(
    narratorRecords, participants('narrator'), sessions(),
  )
  await narrator.execute('narrator-1', {
    ...base,
    characterId: 'character-1',
  })
  assert.equal(narratorRecords.calls[0].accessScope, 'narrator')
})

test('039-B2 valida coherencia de personaje cronica y sesion', async () => {
  const useCase = new ListDiceRollHistoryUseCase(
    repository(), participants(), sessions(),
  )
  await assert.rejects(
    useCase.execute('owner-1', {
      ...base,
      characterId: 'character-1',
      chronicleId: 'chronicle-2',
    }),
    DiceRollContextMismatchError,
  )
  await assert.rejects(
    useCase.execute('viewer-1', {
      ...base,
      sessionId: 'session-1',
    }),
    DiceRollContextMismatchError,
  )
})

test('039-B2 detalle privado solo es visible a ejecutor o Narrador', async () => {
  const privateRecord = {
    id: 'roll-1', actorId: 'actor-1', chronicleId: 'chronicle-1',
    visibility: 'private',
  }
  const player = new LoadDiceRollHistoryUseCase(
    repository({ record: privateRecord }),
    participants('player'),
  )
  await assert.rejects(
    player.execute('player-2', 'roll-1'),
    DiceRollContextPermissionError,
  )
  assert.equal(
    await player.execute('actor-1', 'roll-1'),
    privateRecord,
  )
  const narrator = new LoadDiceRollHistoryUseCase(
    repository({ record: privateRecord }),
    participants('narrator'),
  )
  assert.equal(
    await narrator.execute('narrator-1', 'roll-1'),
    privateRecord,
  )
})

test('039-B2 detalle contextual exige participacion activa', async () => {
  const record = {
    id: 'roll-1', actorId: 'actor-1', chronicleId: 'chronicle-1',
    visibility: 'contextual',
  }
  const useCase = new LoadDiceRollHistoryUseCase(
    repository({ record }),
    participants('player', false),
  )
  await assert.rejects(
    useCase.execute('viewer-1', 'roll-1'),
    DiceRollContextPermissionError,
  )
})

test('039-B2 repositorio pagina por createdAt e id con limit mas uno', async () => {
  const source = await readFile(
    new URL('../src/dice/infrastructure/prisma-dice-roll.repository.ts', import.meta.url),
    'utf8',
  )
  assert.match(source, /take: query\.limit \+ 1/)
  assert.match(source, /\{ createdAt: 'desc' \}/)
  assert.match(source, /\{ id: 'desc' \}/)
  assert.match(source, /createdAt: \{\s*lt: query\.cursor\.createdAt/)
  assert.match(source, /id: \{ lt: query\.cursor\.id \}/)
  assert.match(source, /PrismaDiceRollVisibility\.CONTEXTUAL/)
})
