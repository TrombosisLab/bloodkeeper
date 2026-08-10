import assert from 'node:assert/strict'
import {
  readFileSync,
} from 'node:fs'
import test from 'node:test'

const controller = readFileSync(
  new URL(
    '../src/chronicles/presentation/chronicle-session.controller.ts',
    import.meta.url,
  ),
  'utf8',
)
const dto = readFileSync(
  new URL(
    '../src/chronicles/presentation/chronicle-session.dto.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  '035-B publica CRUD complete y archive sin DELETE',
  () => {
    assert.match(controller, /chronicles\/:chronicleId\/sessions/)
    for (const route of [
      "@Get()",
      "@Post()",
      "@Get(':sessionId')",
      "@Patch(':sessionId')",
      "@Patch(':sessionId/complete')",
      "@Patch(':sessionId/archive')",
    ]) {
      assert.match(controller, new RegExp(route.replace(/[()]/g, '\\$&')))
    }
    assert.doesNotMatch(controller, /Delete|@Delete/)
  },
)

test(
  '035-B usa identidad autenticada y Narrador contextual',
  () => {
    assert.match(controller, /parseChronicleNarratorId/)
    assert.match(controller, /CHRONICLE_SESSION_PERMISSION_DENIED/)
    assert.match(controller, /AUTHENTICATION_REQUIRED/)
  },
)

test(
  '035-B DTO limita campos y protege status',
  () => {
    for (const field of [
      'sessionNumber',
      'title',
      'realDate',
      'summary',
      'narratorNotes',
    ]) {
      assert.match(dto, new RegExp(field))
    }
    assert.doesNotMatch(
      dto.slice(
        dto.indexOf('const editableFields'),
        dto.indexOf('function supportedEditableKeys'),
      ),
      /status|eventId|npcId|locationId|characterId|dice/,
    )
  },
)

test(
  '035-B expone errores estructurados y no adelanta relaciones',
  () => {
    assert.match(controller, /INVALID_CHRONICLE_SESSION_REQUEST/)
    assert.match(controller, /CHRONICLE_SESSION_NOT_FOUND/)
    assert.doesNotMatch(
      controller + dto,
      /eventIds|npcIds|locationIds|characterIds|diceRolls|sharedWith/,
    )
  },
)
