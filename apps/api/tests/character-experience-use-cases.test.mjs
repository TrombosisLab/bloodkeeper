import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CorrectCharacterExperienceUseCase,
  CharacterExperienceChronicleRequiredError,
  CharacterExperienceSessionRequiredError,
  GrantCharacterExperienceUseCase,
  LoadCharacterExperienceUseCase,
} from '../dist/characters/application/character-experience.use-cases.js'
import {
  CharacterExperiencePermissionError,
} from '../dist/characters/application/character-experience-permission.js'

const characterId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const ownerId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const narratorId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const chronicleId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
const sessionId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
const movementId = 'ffffffff-ffff-4fff-8fff-ffffffffffff'
const operationId = '11111111-1111-4111-8111-111111111111'

function ledger(total = 0, movements = []) {
  return {
    characterId,
    total,
    spent: 0,
    available: total,
    movements,
  }
}

function repository(overrides = {}) {
  const calls = []
  return {
    calls,
    async findCharacter() {
      return {
        id: characterId,
        ownerId,
        chronicleId,
        status: 'active',
      }
    },
    async findSession() {
      return {
        id: sessionId,
        chronicleId,
        status: 'completed',
      }
    },
    async findMovement() {
      return {
        id: movementId,
        characterId,
        actorId: narratorId,
        sessionId,
        type: 'grant',
        component: 'earned',
        amount: 1,
        reason: 'session_played',
        acquisitionType: null,
        acquisitionKey: null,
        correctsMovementId: null,
        createdAt: new Date(0),
      }
    },
    async loadLedger() {
      return ledger(1)
    },
    async appendGrant(data) {
      calls.push(['grant', data])
      return ledger(data.amount)
    },
    async appendCorrection(data) {
      calls.push(['correction', data])
      return ledger(0)
    },
    ...overrides,
  }
}

function participants(role = 'narrator') {
  return {
    async findActiveMembership() {
      return role === null
        ? null
        : { role }
    },
  }
}

test('056-B permite al propietario leer su ledger sin auto-conceder', async () => {
  const repo = repository({
    async loadLedger() {
      return ledger(0)
    },
  })
  const result = await new LoadCharacterExperienceUseCase(
    repo,
    participants(null),
  ).execute(ownerId, characterId)
  assert.equal(result.available, 0)
  assert.deepEqual(repo.calls, [])
})

test('056-B concede 1 XP por sesion mediante Narrador contextual', async () => {
  const repo = repository()
  const result = await new GrantCharacterExperienceUseCase(
    repo,
    participants('narrator'),
  ).execute(narratorId, {
    characterId,
    reason: 'session_played',
    sessionId,
    operationId,
  })
  assert.equal(result.total, 1)
  assert.equal(repo.calls[0][1].amount, 1)
  assert.match(
    repo.calls[0][1].deduplicationKey,
    /grant:session:/,
  )
})

test('056-B concede 2 XP solo cuando se selecciona ritmo rapido', async () => {
  const repo = repository()
  await new GrantCharacterExperienceUseCase(
    repo,
    participants('narrator'),
  ).execute(narratorId, {
    characterId,
    reason: 'fast_session',
    sessionId,
    operationId,
  })
  assert.equal(repo.calls[0][1].amount, 2)
})

test('056-B exige sesion para motivos ligados a sesion', async () => {
  await assert.rejects(
    () =>
      new GrantCharacterExperienceUseCase(
        repository(),
        participants('narrator'),
      ).execute(narratorId, {
        characterId,
        reason: 'session_played',
        sessionId: null,
        operationId,
      }),
    CharacterExperienceSessionRequiredError,
  )
})

test('056-B no permite que jugador o admin sustituyan al Narrador', async () => {
  for (const role of ['player', null]) {
    await assert.rejects(
      () =>
        new GrantCharacterExperienceUseCase(
          repository(),
          participants(role),
        ).execute(narratorId, {
          characterId,
          reason: 'story_end',
          sessionId: null,
          operationId,
        }),
      CharacterExperiencePermissionError,
    )
  }
})

test('056-B no infiere concesiones para personaje sin cronica', async () => {
  const repo = repository({
    async findCharacter() {
      return {
        id: characterId,
        ownerId,
        chronicleId: null,
        status: 'active',
      }
    },
  })
  await assert.rejects(
    () =>
      new GrantCharacterExperienceUseCase(
        repo,
        participants('narrator'),
      ).execute(narratorId, {
        characterId,
        reason: 'story_end',
        sessionId: null,
        operationId,
      }),
    CharacterExperienceChronicleRequiredError,
  )
})

test('056-B registra correccion compensatoria sin borrar historial', async () => {
  const repo = repository()
  await new CorrectCharacterExperienceUseCase(
    repo,
    participants('narrator'),
  ).execute(narratorId, {
    characterId,
    targetMovementId: movementId,
    amount: -1,
    reason: 'Concesion duplicada',
    operationId,
  })
  assert.deepEqual(repo.calls[0][0], 'correction')
  assert.equal(repo.calls[0][1].targetMovementId, movementId)
  assert.equal(repo.calls[0][1].amount, -1)
})
