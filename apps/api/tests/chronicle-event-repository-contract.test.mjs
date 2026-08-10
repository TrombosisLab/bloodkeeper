import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const repository = await readFile(
  new URL(
    '../src/chronicles/infrastructure/prisma-chronicle-event.repository.ts',
    import.meta.url,
  ),
  'utf8',
)

const contract = await readFile(
  new URL(
    '../src/chronicles/application/chronicle-event.repository.ts',
    import.meta.url,
  ),
  'utf8',
)

const moduleSource = await readFile(
  new URL(
    '../src/chronicles/chronicles.module.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  '034-B repositorio declara CRUD reorder y archive',
  () => {
    for (const method of [
      'listByChronicleId',
      'findById',
      'create',
      'update',
      'reorderActive',
      'archive',
    ]) {
      assert.match(
        contract,
        new RegExp(`${method}\\(`),
      )
    }
  },
)

test(
  '034-B creación asigna orden al final de ACTIVE en transacción',
  () => {
    assert.match(
      repository,
      /create\([\s\S]*\$transaction/,
    )
    assert.match(
      repository,
      /aggregate\([\s\S]*timelineOrder/,
    )
    assert.match(
      repository,
      /_max\.timelineOrder[\s\S]*\+ 1/,
    )
  },
)

test(
  '034-B reorder valida conjunto completo y actualiza atómicamente',
  () => {
    assert.match(
      repository,
      /reorderActive\([\s\S]*\$transaction/,
    )
    assert.match(
      repository,
      /new Set\(eventIds\)/,
    )
    assert.match(
      repository,
      /ChronicleEventReorderMismatchError/,
    )
    assert.match(
      repository,
      /Promise\.all/,
    )
  },
)

test(
  '034-B listado usa timelineOrder y no fechas narrativas',
  () => {
    const listing =
      repository.slice(
        repository.indexOf(
          'async listByChronicleId',
        ),
        repository.indexOf(
          'async findById',
        ),
      )

    assert.match(
      listing,
      /timelineOrder/,
    )
    assert.doesNotMatch(
      listing,
      /realDate|narrativeTimeLabel/,
    )
  },
)

test(
  '034-B update y archive están escopados por chronicleId y ACTIVE',
  () => {
    assert.match(
      repository,
      /updateMany[\s\S]*chronicleId:[\s\S]*data\.chronicleId[\s\S]*PrismaChronicleEventStatus\.ACTIVE/,
    )
    assert.match(
      repository,
      /archive\([\s\S]*updateMany[\s\S]*chronicleId[\s\S]*PrismaChronicleEventStatus\.ACTIVE/,
    )
  },
)

test(
  '034-B módulo registra controller repositorio y casos de uso',
  () => {
    for (const symbol of [
      'ChronicleEventController',
      'PrismaChronicleEventRepository',
      'CHRONICLE_EVENT_REPOSITORY',
      'ListChronicleEventsUseCase',
      'LoadChronicleEventUseCase',
      'CreateChronicleEventUseCase',
      'UpdateChronicleEventUseCase',
      'ReorderChronicleEventsUseCase',
      'ArchiveChronicleEventUseCase',
    ]) {
      assert.match(
        moduleSource,
        new RegExp(symbol),
      )
    }
  },
)
