import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const repository = await readFile(
  new URL(
    '../src/chronicles/infrastructure/prisma-chronicle-npc.repository.ts',
    import.meta.url,
  ),
  'utf8',
)

const contract = await readFile(
  new URL(
    '../src/chronicles/application/chronicle-npc.repository.ts',
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
  '032-B repositorio declara listar consultar crear editar y archivar',
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
  '032-B Prisma mantiene operaciones dentro de chronicleId',
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
  '032-B creación fija SIMPLE y ACTIVE',
  () => {
    assert.match(
      repository,
      /PrismaChronicleNpcStatus\.ACTIVE/,
    )
    assert.match(
      repository,
      /PrismaChronicleNpcDetailLevel\.SIMPLE/,
    )
  },
)

test(
  '032-B módulo registra controller repositorio y casos de uso PNJ',
  () => {
    for (const symbol of [
      'ChronicleNpcController',
      'PrismaChronicleNpcRepository',
      'CHRONICLE_NPC_REPOSITORY',
      'ListChronicleNpcsUseCase',
      'LoadChronicleNpcUseCase',
      'CreateChronicleNpcUseCase',
      'UpdateChronicleNpcUseCase',
      'ArchiveChronicleNpcUseCase',
    ]) {
      assert.match(
        moduleSource,
        new RegExp(symbol),
      )
    }
  },
)
