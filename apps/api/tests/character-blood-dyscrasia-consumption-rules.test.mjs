import assert from 'node:assert/strict'
import test from 'node:test'

import {
  assertConsumableCharacterBloodDyscrasia,
  InvalidCharacterBloodDyscrasiaConsumptionError,
  isSameCharacterBloodDyscrasiaConsumptionOperation,
} from '../dist/characters/domain/character-blood-dyscrasia-consumption.types.js'

test('058-D3 sólo permite las cuatro Discrasias consumibles del catálogo', () => {
  for (const key of [
    'energetic',
    'evocative',
    'reflection',
    'excited',
  ]) {
    assert.doesNotThrow(() =>
      assertConsumableCharacterBloodDyscrasia(
        key,
      ),
    )
  }

  for (const key of [
    'aggressive',
    'cycleOfViolence',
    'relaxed',
    'sniffingGame',
  ]) {
    assert.throws(
      () =>
        assertConsumableCharacterBloodDyscrasia(
          key,
        ),
      (error) => {
        assert.ok(
          error instanceof
            InvalidCharacterBloodDyscrasiaConsumptionError,
        )
        assert.deepEqual(
          error.violations,
          ['NOT_CONSUMABLE'],
        )
        return true
      },
    )
  }
})

test('058-D3 idempotencia compara instancia adquirida y key', () => {
  const existing = {
    characterId:
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    operationId:
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    sourceBloodOperationId:
      'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    dyscrasiaKey: 'energetic',
    createdAt: new Date(),
  }

  assert.equal(
    isSameCharacterBloodDyscrasiaConsumptionOperation(
      existing,
      {
        sourceBloodOperationId:
          existing.sourceBloodOperationId,
        dyscrasiaKey: 'energetic',
      },
    ),
    true,
  )

  assert.equal(
    isSameCharacterBloodDyscrasiaConsumptionOperation(
      existing,
      {
        sourceBloodOperationId:
          'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        dyscrasiaKey: 'energetic',
      },
    ),
    false,
  )

  assert.equal(
    isSameCharacterBloodDyscrasiaConsumptionOperation(
      existing,
      {
        sourceBloodOperationId:
          existing.sourceBloodOperationId,
        dyscrasiaKey: 'excited',
      },
    ),
    false,
  )
})
