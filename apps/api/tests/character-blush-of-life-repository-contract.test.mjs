import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const repository =
  await readFile(
    new URL(
      '../src/characters/infrastructure/prisma-character-blush-of-life.repository.ts',
      import.meta.url,
    ),
    'utf8',
  )

test(
  '059-D1A persistencia exenta usa transacción y CAS',
  () => {
    assert.match(
      repository,
      /\$transaction/,
    )
    assert.match(
      repository,
      /characterBlushOfLifeExemptionOperation[\s\S]*findUnique/,
    )
    assert.match(
      repository,
      /transaction\.character[\s\S]*\.updateMany/,
    )
    assert.match(
      repository,
      /revision:[\s\S]*increment:\s*1/,
    )
    assert.match(
      repository,
      /characterBlushOfLifeExemptionOperation[\s\S]*\.create/,
    )
  },
)

test(
  '059-D1A revalida la misma instancia activa dentro de transacción',
  () => {
    assert.match(
      repository,
      /dyscrasiaKey:[\s\S]*true/,
    )
    assert.match(
      repository,
      /dyscrasiaSourceOperationId:[\s\S]*true/,
    )
    assert.match(
      repository,
      /current\.blood\.dyscrasiaKey !==[\s\S]*expectedKey/,
    )
    assert.match(
      repository,
      /dyscrasiaSourceOperationId !==[\s\S]*data\.sourceBloodOperationId/,
    )
  },
)

test(
  '059-D1A outcome exento no modifica Sangre ni crea dado',
  () => {
    const block =
      repository.slice(
        repository.indexOf(
          'async persistExemption(',
        ),
      )

    for (const forbidden of [
      'characterBloodState.update',
      'characterBloodState.updateMany',
      'dyscrasiaKey: null',
      'diceRollRecord',
      'characterRouseCheckOperation.create',
    ]) {
      assert.equal(
        block.includes(forbidden),
        false,
      )
    }
  },
)
