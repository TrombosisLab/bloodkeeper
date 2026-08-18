import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const controller = await readFile(
  new URL(
    '../src/chronicles/presentation/chronicle-session-attendance.controller.ts',
    import.meta.url,
  ),
  'utf8',
)

const dto = await readFile(
  new URL(
    '../src/chronicles/presentation/chronicle-session-attendance.dto.ts',
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
  'Attendance publica el recurso anidado bajo sesión',
  () => {
    assert.match(
      controller,
      /chronicles\/:chronicleId\/sessions\/:sessionId\/attendances/,
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
      /@Patch\(':characterId\/remove'\)/,
    )
    assert.doesNotMatch(
      controller,
      /@Delete/,
    )
  },
)

test(
  'Attendance GET conserva contrato paginado',
  () => {
    assert.match(
      controller,
      /@Query\(\)/,
    )
    assert.match(
      controller,
      /parseOffsetPaginationQuery/,
    )
    assert.match(
      controller,
      /nextOffset/,
    )
  },
)

test(
  'Attendance valida UUID/body y expone errores estructurados',
  () => {
    assert.match(
      dto,
      /body must contain only characterId/,
    )

    for (const code of [
      'INVALID_CHRONICLE_SESSION_ATTENDANCE_REQUEST',
      'CHRONICLE_SESSION_ATTENDANCE_PERMISSION_DENIED',
      'CHRONICLE_SESSION_ATTENDANCE_SESSION_NOT_FOUND',
      'CHRONICLE_SESSION_ATTENDANCE_SESSION_NOT_EDITABLE',
      'CHRONICLE_SESSION_ATTENDANCE_CHARACTER_NOT_ELIGIBLE',
    ]) {
      assert.match(
        controller,
        new RegExp(code),
      )
    }
  },
)

test(
  'ChroniclesModule registra y exporta el port Attendance sin CharactersModule',
  () => {
    assert.match(
      moduleSource,
      /PrismaChronicleSessionAttendanceRepository/,
    )
    assert.match(
      moduleSource,
      /provide:[\s\S]*CHRONICLE_SESSION_ATTENDANCE_REPOSITORY/,
    )
    assert.match(
      moduleSource,
      /ChronicleSessionAttendanceController/,
    )
    assert.match(
      moduleSource,
      /exports:[\s\S]*CHRONICLE_SESSION_ATTENDANCE_REPOSITORY/,
    )
    assert.doesNotMatch(
      moduleSource,
      /CharactersModule/,
    )
  },
)
