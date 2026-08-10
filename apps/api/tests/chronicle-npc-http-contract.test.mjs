import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const controller = await readFile(
  new URL(
    '../src/chronicles/presentation/chronicle-npc.controller.ts',
    import.meta.url,
  ),
  'utf8',
)

const dto = await readFile(
  new URL(
    '../src/chronicles/presentation/chronicle-npc.dto.ts',
    import.meta.url,
  ),
  'utf8',
)

const permission = await readFile(
  new URL(
    '../src/chronicles/application/chronicle-npc-permission.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  '032-B publica CRUD operativo sin DELETE destructivo',
  () => {
    assert.match(
      controller,
      /@Controller\('chronicles\/:chronicleId\/npcs'\)/,
    )
    assert.match(
      controller,
      /@Get\(\)/,
    )
    assert.match(
      controller,
      /@Post\(\)/,
    )
    assert.match(
      controller,
      /@Get\(':npcId'\)/,
    )
    assert.match(
      controller,
      /@Patch\(':npcId'\)/,
    )
    assert.match(
      controller,
      /@Patch\(':npcId\/archive'\)/,
    )
    assert.doesNotMatch(
      controller,
      /@Delete/,
    )
  },
)

test(
  '032-B autorización usa identidad autenticada y Narrador contextual',
  () => {
    assert.match(
      controller,
      /request\.user\?\.id/,
    )
    assert.doesNotMatch(
      controller,
      /roles\.includes\('narrator'\)/,
    )
    assert.match(
      permission,
      /findActiveMembership/,
    )
    assert.match(
      permission,
      /membership\.role !== 'narrator'/,
    )
  },
)

test(
  '032-B DTO limita primera versión a campos de PNJ simple',
  () => {
    for (const field of [
      'name',
      'category',
      'description',
      'narrativeRole',
      'notes',
    ]) {
      assert.match(
        dto,
        new RegExp(`'${field}'`),
      )
    }

    assert.doesNotMatch(
      dto,
      /locationId|eventId|sessionId|characterId|attributes|skills|disciplines/,
    )
  },
)

test(
  '032-B expone errores estructurados',
  () => {
    for (const code of [
      'INVALID_CHRONICLE_NPC_REQUEST',
      'CHRONICLE_NPC_PERMISSION_DENIED',
      'CHRONICLE_NPC_NOT_FOUND',
    ]) {
      assert.match(
        controller,
        new RegExp(code),
      )
    }
  },
)
