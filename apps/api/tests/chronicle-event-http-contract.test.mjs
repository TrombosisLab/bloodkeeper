import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const controller = await readFile(
  new URL(
    '../src/chronicles/presentation/chronicle-event.controller.ts',
    import.meta.url,
  ),
  'utf8',
)

const dto = await readFile(
  new URL(
    '../src/chronicles/presentation/chronicle-event.dto.ts',
    import.meta.url,
  ),
  'utf8',
)

const permission = await readFile(
  new URL(
    '../src/chronicles/application/chronicle-event-permission.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  '034-B publica CRUD reorder y archive sin DELETE',
  () => {
    assert.match(
      controller,
      /chronicles\/:chronicleId\/events/,
    )
    assert.match(controller, /@Get\(\)/)
    assert.match(controller, /@Post\(\)/)
    assert.match(controller, /@Patch\('reorder'\)/)
    assert.match(controller, /@Get\(':eventId'\)/)
    assert.match(controller, /@Patch\(':eventId'\)/)
    assert.match(
      controller,
      /@Patch\(':eventId\/archive'\)/,
    )
    assert.doesNotMatch(controller, /@Delete/)
  },
)

test(
  '034-B autorización usa identidad autenticada y Narrador contextual',
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
  '034-B DTO limita edición y timelineOrder no es editable',
  () => {
    for (const field of [
      'title',
      'description',
      'narratorNotes',
      'narrativeTimeLabel',
      'realDate',
    ]) {
      assert.match(
        dto,
        new RegExp(`'${field}'`),
      )
    }

    const editable =
      dto.slice(
        dto.indexOf(
          'const editableFields',
        ),
        dto.indexOf(
          'function supportedEditableKeys',
        ),
      )

    assert.doesNotMatch(
      editable,
      /timelineOrder/,
    )
  },
)

test(
  '034-B reorder exige array y rechaza duplicados',
  () => {
    assert.match(
      dto,
      /parseReorderChronicleEventsRequest/,
    )
    assert.match(
      dto,
      /Array\.isArray\(value\.eventIds\)/,
    )
    assert.match(
      dto,
      /new Set\(eventIds\)\.size/,
    )
  },
)

test(
  '034-B expone errores estructurados exactos',
  () => {
    for (const code of [
      'INVALID_CHRONICLE_EVENT_REQUEST',
      'CHRONICLE_EVENT_PERMISSION_DENIED',
      'CHRONICLE_EVENT_NOT_FOUND',
      'CHRONICLE_EVENT_REORDER_MISMATCH',
    ]) {
      assert.match(
        controller,
        new RegExp(code),
      )
    }
  },
)

test(
  '034-B no adelanta relaciones sharing estados futuros ni SPEC-035',
  () => {
    assert.doesNotMatch(
      dto,
      /characterId|npcId|locationId|sessionId|shared|visibility|planned|occurred/i,
    )
  },
)
