import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

import {
  InvalidCharacterAdvancementRequestError,
  parseCharacterAdvancementPurchase,
} from '../dist/characters/presentation/character-advancement.dto.js'

async function source(relative) {
  return readFile(
    new URL(
      `../${relative}`,
      import.meta.url,
    ),
    'utf8',
  )
}

const characterId =
  '11111111-1111-4111-8111-111111111111'
const operationId =
  '22222222-2222-4222-8222-222222222222'

function body(extra = {}) {
  return {
    expectedRevision: 7,
    operationId,
    advancement: {
      kind: 'discipline',
      disciplineKey: 'celerity',
      powerKey:
        'celerity-rapid-reflexes',
    },
    ...extra,
  }
}

test('058-E2 DTO sólo permite opt-in booleano, nunca key/source/coste/descuento', () => {
  const parsed =
    parseCharacterAdvancementPurchase(
      body({
        useDyscrasiaExperience:
          true,
      }),
      characterId,
    )

  assert.equal(
    parsed.useDyscrasiaExperience,
    true,
  )

  assert.throws(
    () =>
      parseCharacterAdvancementPurchase(
        body({
          useDyscrasiaExperience:
            'yes',
        }),
        characterId,
      ),
    InvalidCharacterAdvancementRequestError,
  )

  for (const forbidden of [
    'dyscrasiaKey',
    'dyscrasiaSourceOperationId',
    'discount',
    'cost',
  ]) {
    assert.throws(
      () =>
        parseCharacterAdvancementPurchase(
          body({
            [forbidden]:
              forbidden === 'cost'
                ? 1
                : 'client-value',
          }),
          characterId,
        ),
      InvalidCharacterAdvancementRequestError,
    )
  }
})

test('058-E2 repositorio mantiene gasto + evolución + consumo D3 en una transacción', async () => {
  const repository =
    await source(
      'src/characters/infrastructure/prisma-character-experience.repository.ts',
    )

  const start =
    repository.indexOf(
      '  async purchase(',
    )

  assert.ok(start >= 0)

  const block =
    repository.slice(start)

  assert.match(
    block,
    /this\.database\.\$transaction/,
  )
  assert.match(
    block,
    /FOR UPDATE/,
  )
  assert.match(
    block,
    /isCharacterBloodDyscrasiaExperienceBenefit/,
  )
  assert.match(
    block,
    /characterBloodState[\s\S]*dyscrasiaSourceOperationId/,
  )
  assert.match(
    block,
    /characterBloodDyscrasiaConsumptionOperation[\s\S]*characterId_sourceBloodOperationId/,
  )
  assert.match(
    block,
    /applyAdvancementMutation/,
  )
  assert.match(
    block,
    /dyscrasiaKey:\s*null[\s\S]*dyscrasiaAcquisitionMode:[\s\S]*null[\s\S]*dyscrasiaSourceOperationId:[\s\S]*null/,
  )
  assert.match(
    block,
    /characterBloodDyscrasiaConsumptionOperation[\s\S]*\.create/,
  )
  assert.match(
    block,
    /PrismaCharacterExperienceMovementType\.SPEND/,
  )
  assert.match(
    block,
    /amount:[\s\S]*data\.cost/,
  )
  assert.doesNotMatch(
    block,
    /PrismaCharacterExperienceMovementType\.GRANT/,
  )

  const revisionIncrements =
    block.match(
      /revision:\s*\{\s*increment:\s*1/g,
    ) ?? []

  assert.equal(
    revisionIncrements.length,
    1,
  )
})

test('058-E2 no crea endpoint genérico de consumo', async () => {
  const [
    advancementController,
    module,
  ] =
    await Promise.all([
      source(
        'src/characters/presentation/character-advancement.controller.ts',
      ),
      source(
        'src/characters/characters.module.ts',
      ),
    ])

  assert.doesNotMatch(
    advancementController,
    /@Post\([^)]*consume/i,
  )

  assert.equal(
    module.includes(
      'ConsumeCharacterBloodDyscrasiaUseCase',
    ),
    false,
  )
})
