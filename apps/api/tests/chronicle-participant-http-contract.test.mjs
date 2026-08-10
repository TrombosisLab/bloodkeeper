import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const controller = await readFile(
  new URL(
    '../src/chronicles/presentation/chronicle.controller.ts',
    import.meta.url,
  ),
  'utf8',
)

const dto = await readFile(
  new URL(
    '../src/chronicles/presentation/chronicle-participant.dto.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  '031-B publica listado incorporación y retirada',
  () => {
    assert.match(
      controller,
      /@Get\(':chronicleId\/participants'\)/,
    )
    assert.match(
      controller,
      /@Post\(':chronicleId\/participants'\)/,
    )
    assert.match(
      controller,
      /:participantId\/retire/,
    )
  },
)

test(
  '031-B DTO limita incorporación a userId y role',
  () => {
    assert.match(
      dto,
      /key !== 'userId'[\s\S]*key !== 'role'/,
    )
    assert.match(
      dto,
      /value\.role !== 'narrator'[\s\S]*value\.role !== 'player'/,
    )
  },
)

test(
  '031-B errores estructurados',
  () => {
    for (const code of [
      'CHRONICLE_PARTICIPANT_PERMISSION_DENIED',
      'CHRONICLE_PARTICIPANT_USER_NOT_FOUND',
      'CHRONICLE_PARTICIPANT_NOT_FOUND',
      'CHRONICLE_PARTICIPANT_DUPLICATE',
      'CHRONICLE_LAST_NARRATOR_REQUIRED',
      'CHRONICLE_PARTICIPANT_WRITE_CONFLICT',
    ]) {
      assert.match(
        controller,
        new RegExp(code),
      )
    }
  },
)
