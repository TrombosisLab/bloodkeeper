import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const controller = await readFile(
  new URL(
    '../src/chronicles/presentation/chronicle-location.controller.ts',
    import.meta.url,
  ),
  'utf8',
)

const dto = await readFile(
  new URL(
    '../src/chronicles/presentation/chronicle-location.dto.ts',
    import.meta.url,
  ),
  'utf8',
)

const permission = await readFile(
  new URL(
    '../src/chronicles/application/chronicle-location-permission.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  '033-B publica CRUD operativo sin DELETE destructivo',
  () => {
    assert.match(
      controller,
      /chronicles\/:chronicleId\/locations/,
    )
    assert.match(controller, /@Get\(\)/)
    assert.match(controller, /@Post\(\)/)
    assert.match(
      controller,
      /@Get\(':locationId'\)/,
    )
    assert.match(
      controller,
      /@Patch\(':locationId'\)/,
    )
    assert.match(
      controller,
      /@Patch\(':locationId\/archive'\)/,
    )
    assert.doesNotMatch(
      controller,
      /@Delete/,
    )
  },
)

test(
  '033-B autorización usa identidad autenticada y Narrador contextual',
  () => {
    assert.match(
      controller,
      /request\.user\?\.id/,
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
  '033-B DTO limita campos a Localización narrativa y jerarquía',
  () => {
    for (const field of [
      'name',
      'category',
      'description',
      'narratorNotes',
      'parentLocationId',
    ]) {
      assert.match(
        dto,
        new RegExp(`'${field}'`),
      )
    }

    assert.doesNotMatch(
      dto,
      /npcId|characterId|eventId|sessionId|latitude|longitude|geometry|geography/,
    )
  },
)

test(
  '033-B expone errores estructurados de jerarquía y permisos',
  () => {
    for (const code of [
      'INVALID_CHRONICLE_LOCATION_REQUEST',
      'CHRONICLE_LOCATION_PERMISSION_DENIED',
      'CHRONICLE_LOCATION_NOT_FOUND',
      'CHRONICLE_LOCATION_PARENT_NOT_FOUND',
      'CHRONICLE_LOCATION_HIERARCHY_CYCLE',
    ]) {
      assert.match(
        controller,
        new RegExp(code),
      )
    }
  },
)
