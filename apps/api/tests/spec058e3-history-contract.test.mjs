import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const draftUrl =
  new URL(
    '../src/characters/infrastructure/prisma-character-draft.repository.ts',
    import.meta.url,
  )

const experienceUrl =
  new URL(
    '../src/characters/infrastructure/prisma-character-experience.repository.ts',
    import.meta.url,
  )

const previewUrl =
  new URL(
    '../src/characters/application/preview-character-advancement.use-case.ts',
    import.meta.url,
  )

function method(
  source,
  marker,
  nextMarker,
) {
  const start =
    source.indexOf(marker)

  assert.notEqual(
    start,
    -1,
    `${marker} no encontrado`,
  )

  const end =
    source.indexOf(
      nextMarker,
      start + marker.length,
    )

  assert.notEqual(
    end,
    -1,
    `${nextMarker} no encontrado`,
  )

  return source.slice(
    start,
    end,
  )
}

test('058-E3 alimentación guarda historial dentro de applyBloodResonance y reutiliza operationId', async () => {
  const source =
    await readFile(
      draftUrl,
      'utf8',
    )

  const block =
    method(
      source,
      '  async applyBloodResonance(',
      '\n  async findActiveBloodDyscrasia(',
    )

  assert.match(
    block,
    /buildCharacterBloodFeedingHistoryEntry/,
  )
  assert.match(
    block,
    /characterHistoryEntry[\s\S]*create/,
  )
  assert.match(
    block,
    /id:[\s\S]*data\.operationId/,
  )
  assert.match(
    block,
    /characterBloodResonanceOperation[\s\S]*create[\s\S]*characterHistoryEntry/,
  )
})

test('058-E3 consumo D3 guarda una sola entrada en su transacción mecánica', async () => {
  const source =
    await readFile(
      draftUrl,
      'utf8',
    )

  const block =
    method(
      source,
      '  async consumeBloodDyscrasia(',
      '\n  async updateState(',
    )

  assert.match(
    block,
    /buildCharacterBloodDyscrasiaConsumptionHistoryEntry/,
  )
  assert.match(
    block,
    /characterBloodDyscrasiaConsumptionOperation[\s\S]*create[\s\S]*characterHistoryEntry/,
  )
  assert.match(
    block,
    /id:[\s\S]*data\.operationId/,
  )
})

test('058-E3 compra E2 acopla SPEND, consumo y historial sin crear GRANT', async () => {
  const source =
    await readFile(
      experienceUrl,
      'utf8',
    )

  const start =
    source.indexOf(
      '  async purchase(',
    )

  assert.notEqual(start, -1)

  const block =
    source.slice(start)

  assert.match(
    block,
    /characterBloodDyscrasiaConsumptionOperation[\s\S]*create[\s\S]*characterHistoryEntry[\s\S]*characterExperienceMovement[\s\S]*create/,
  )
  assert.match(
    block,
    /benefit\.dyscrasiaKey/,
  )
  assert.match(
    block,
    /benefit\.disciplineKey/,
  )
  assert.match(
    block,
    /id:[\s\S]*data\.operationId/,
  )

  const historyArea =
    block.slice(
      block.indexOf(
        'buildCharacterBloodDyscrasiaConsumptionHistoryEntry',
      ),
    )

  assert.equal(
    /PrismaCharacterExperienceMovementType\.GRANT/.test(
      historyArea,
    ),
    false,
  )
})

test('058-E3 preview/E1 no genera historial como efecto lateral', async () => {
  const source =
    await readFile(
      previewUrl,
      'utf8',
    )

  assert.equal(
    source.includes(
      'characterHistoryEntry',
    ),
    false,
  )
  assert.equal(
    source.includes(
      'character-blood-history.rules',
    ),
    false,
  )
})
