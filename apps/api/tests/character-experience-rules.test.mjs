import assert from 'node:assert/strict'
import test from 'node:test'
import {
  CharacterExperienceBalanceError,
  characterExperienceGrantKey,
  characterExperienceGrantPolicy,
  projectCharacterExperienceCorrection,
} from '../dist/characters/domain/character-experience.rules.js'

test('056-B fija las tres concesiones normativas iniciales', () => {
  assert.deepEqual(
    characterExperienceGrantPolicy('session_played'),
    { amount: 1, sessionRequired: true },
  )
  assert.deepEqual(
    characterExperienceGrantPolicy('story_end'),
    { amount: 1, sessionRequired: false },
  )
  assert.deepEqual(
    characterExperienceGrantPolicy('fast_session'),
    { amount: 2, sessionRequired: true },
  )
})

test('056-B deduplica por personaje sesion y motivo', () => {
  const sessionId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  assert.equal(
    characterExperienceGrantKey(
      'session_played',
      sessionId,
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    ),
    `grant:session:${sessionId}:session_played`,
  )
})

test('056-B proyecta correcciones sin permitir saldos negativos', () => {
  assert.deepEqual(
    projectCharacterExperienceCorrection(
      { total: 3, spent: 1 },
      'earned',
      -1,
    ),
    { total: 2, spent: 1, available: 1 },
  )
  assert.throws(
    () =>
      projectCharacterExperienceCorrection(
        { total: 1, spent: 0 },
        'earned',
        -2,
      ),
    CharacterExperienceBalanceError,
  )
})
