import assert from 'node:assert/strict'
import {
  readFileSync,
} from 'node:fs'
import test from 'node:test'

const controller = readFileSync(
  new URL(
    '../src/chronicles/presentation/chronicle-session-context.controller.ts',
    import.meta.url,
  ),
  'utf8',
)

const dto = readFileSync(
  new URL(
    '../src/chronicles/presentation/chronicle-session-context.dto.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  '035-D publica GET y PATCH exactos bajo /context',
  () => {
    assert.match(
      controller,
      /chronicles\/:chronicleId\/sessions\/:sessionId\/context/,
    )
    assert.match(
      controller,
      /@Get\(\)/,
    )
    assert.match(
      controller,
      /@Patch\(\)/,
    )
    assert.doesNotMatch(
      controller,
      /@Post|@Delete/,
    )
  },
)

test(
  '035-D PATCH exige tres arrays UUID sin duplicados',
  () => {
    for (const field of [
      'eventIds',
      'npcIds',
      'locationIds',
    ]) {
      assert.match(
        dto,
        new RegExp(field),
      )
    }

    assert.match(
      dto,
      /Array\.isArray/,
    )
    assert.match(
      dto,
      /new Set\(ids\)\.size !== ids\.length/,
    )
    assert.match(
      dto,
      /body\.\$\{field\} is required/,
    )
  },
)

test(
  '035-D expone errores estructurados y mantiene gate Narrador',
  () => {
    for (const code of [
      'INVALID_CHRONICLE_SESSION_CONTEXT_REQUEST',
      'CHRONICLE_SESSION_CONTEXT_REFERENCE_INVALID',
      'CHRONICLE_SESSION_PERMISSION_DENIED',
      'CHRONICLE_SESSION_CONTEXT_NOT_EDITABLE',
      'CHRONICLE_SESSION_NOT_FOUND',
      'AUTHENTICATION_REQUIRED',
    ]) {
      assert.match(
        controller,
        new RegExp(code),
      )
    }

    assert.match(
      controller,
      /LoadChronicleSessionContextUseCase/,
    )
    assert.match(
      controller,
      /ReplaceChronicleSessionContextUseCase/,
    )
  },
)
