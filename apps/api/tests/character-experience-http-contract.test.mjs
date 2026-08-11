import assert from 'node:assert/strict'
import {
  readFileSync,
} from 'node:fs'
import test from 'node:test'
import {
  InvalidCharacterExperienceRequestError,
  parseCorrectCharacterExperienceRequest,
  parseGrantCharacterExperienceRequest,
  toCharacterExperienceResponse,
} from '../dist/characters/presentation/character-experience.dto.js'

const controller = readFileSync(
  new URL(
    '../src/characters/presentation/character-experience.controller.ts',
    import.meta.url,
  ),
  'utf8',
)
const moduleSource = readFileSync(
  new URL(
    '../src/characters/characters.module.ts',
    import.meta.url,
  ),
  'utf8',
)
const characterId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const sessionId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const operationId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const movementId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'

test('056-B expone lectura concesion y correccion sin update ni delete', () => {
  assert.match(
    controller,
    /@Controller\([\s\S]*characters\/:characterId\/experience/,
  )
  assert.match(controller, /@Get\(\)/)
  assert.match(controller, /@Post\('grants'\)/)
  assert.match(controller, /@Post\('corrections'\)/)
  assert.doesNotMatch(controller, /@Patch|@Delete/)
  assert.match(moduleSource, /CharacterExperienceController/)
  assert.match(moduleSource, /CHARACTER_EXPERIENCE_REPOSITORY/)
})

test('056-B acepta motivos cerrados y operacion idempotente', () => {
  assert.deepEqual(
    parseGrantCharacterExperienceRequest(
      characterId,
      {
        reason: 'fast_session',
        sessionId,
        operationId,
      },
    ),
    {
      characterId,
      reason: 'fast_session',
      sessionId,
      operationId,
    },
  )
  assert.throws(
    () =>
      parseGrantCharacterExperienceRequest(
        characterId,
        {
          reason: 'automatic',
          operationId,
        },
      ),
    InvalidCharacterExperienceRequestError,
  )
})

test('056-B valida correcciones firmadas y rechaza campos extra', () => {
  assert.equal(
    parseCorrectCharacterExperienceRequest(
      characterId,
      {
        targetMovementId: movementId,
        amount: -1,
        reason: ' Ajuste trazable ',
        operationId,
      },
    ).reason,
    'Ajuste trazable',
  )
  assert.throws(
    () =>
      parseCorrectCharacterExperienceRequest(
        characterId,
        {
          targetMovementId: movementId,
          amount: 0,
          reason: 'Ajuste',
          operationId,
          total: 99,
        },
      ),
    InvalidCharacterExperienceRequestError,
  )
})

test('056-B serializa saldo derivado e historial mecanico', () => {
  const createdAt = new Date('2026-08-10T20:00:00.000Z')
  const response = toCharacterExperienceResponse({
    characterId,
    total: 2,
    spent: 0,
    available: 2,
    movements: [{
      id: movementId,
      characterId,
      actorId: operationId,
      sessionId,
      type: 'grant',
      component: 'earned',
      amount: 2,
      reason: 'fast_session',
      acquisitionType: null,
      acquisitionKey: null,
      correctsMovementId: null,
      createdAt,
    }],
  })
  assert.equal(response.available, 2)
  assert.equal(
    response.movements[0].createdAt,
    createdAt.toISOString(),
  )
})
