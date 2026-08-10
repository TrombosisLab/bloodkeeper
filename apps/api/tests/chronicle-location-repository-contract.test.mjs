import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const repository = await readFile(
  new URL(
    '../src/chronicles/infrastructure/prisma-chronicle-location.repository.ts',
    import.meta.url,
  ),
  'utf8',
)

const contract = await readFile(
  new URL(
    '../src/chronicles/application/chronicle-location.repository.ts',
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
  '033-B repositorio declara listar consultar crear editar y archivar',
  () => {
    for (const method of [
      'listByChronicleId',
      'findById',
      'create',
      'update',
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
  '033-B Prisma mantiene operaciones dentro de chronicleId',
  () => {
    assert.match(
      repository,
      /findById[\s\S]*chronicleId/,
    )
    assert.match(
      repository,
      /updateMany[\s\S]*chronicleId:[\s\S]*data\.chronicleId/,
    )
    assert.match(
      repository,
      /archive[\s\S]*updateMany[\s\S]*chronicleId/,
    )
  },
)

test(
  '033-B creación fija ACTIVE y mantiene parentLocationId opcional',
  () => {
    assert.match(
      repository,
      /PrismaChronicleLocationStatus\.ACTIVE/,
    )
    assert.match(
      repository,
      /parentLocationId:[\s\S]*data\.parentLocationId/,
    )
  },
)

test(
  '033-B módulo registra controller repositorio y casos de uso',
  () => {
    for (const symbol of [
      'ChronicleLocationController',
      'PrismaChronicleLocationRepository',
      'CHRONICLE_LOCATION_REPOSITORY',
      'ListChronicleLocationsUseCase',
      'LoadChronicleLocationUseCase',
      'CreateChronicleLocationUseCase',
      'UpdateChronicleLocationUseCase',
      'ArchiveChronicleLocationUseCase',
    ]) {
      assert.match(
        moduleSource,
        new RegExp(symbol),
      )
    }
  },
)
