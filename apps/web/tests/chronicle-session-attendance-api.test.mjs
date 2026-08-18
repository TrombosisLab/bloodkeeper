import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const types = await readFile(
  new URL(
    '../src/features/chronicles/types/chronicle-api.types.ts',
    import.meta.url,
  ),
  'utf8',
)

const gateway = await readFile(
  new URL(
    '../src/features/chronicles/infrastructure/chronicle.api.ts',
    import.meta.url,
  ),
  'utf8',
)

test(
  'Attendance A2 modela transporte paginado sin contaminar snapshot de Sesion',
  () => {
    const attendanceIndex =
      types.indexOf(
        'export interface ChronicleSessionAttendanceApiSnapshot',
      )
    const sessionIndex =
      types.indexOf(
        'export type ChronicleSessionApiStatus',
      )

    assert.ok(attendanceIndex >= 0)
    assert.ok(sessionIndex > attendanceIndex)

    const attendanceTypes =
      types.slice(
        attendanceIndex,
        sessionIndex,
      )

    for (const field of [
      'id',
      'sessionId',
      'characterId',
      'createdAt',
      'updatedAt',
      'nextOffset',
      'attending',
    ]) {
      assert.match(
        attendanceTypes,
        new RegExp(`\\b${field}\\b`),
      )
    }
  },
)

test(
  'Attendance A2 valida filas y retirada estructurada',
  () => {
    assert.match(
      gateway,
      /parseChronicleSessionAttendanceResponse/,
    )
    assert.match(
      gateway,
      /typeof value\.sessionId !== 'string'/,
    )
    assert.match(
      gateway,
      /typeof value\.characterId !== 'string'/,
    )
    assert.match(
      gateway,
      /parseChronicleSessionAttendanceRemovalResponse/,
    )
    assert.match(
      gateway,
      /value\.attending !== false/,
    )
  },
)

test(
  'Attendance A2 pagina GET y ofrece helper completo',
  () => {
    assert.match(
      gateway,
      /async sessionAttendancesPage\(/,
    )
    assert.match(
      gateway,
      /\/sessions\/\$\{sessionId\}\/attendances\?limit=\$\{limit\}&offset=\$\{offset\}/,
    )
    assert.match(
      gateway,
      /async sessionAttendances\([\s\S]*while \(nextOffset !== null\)/,
    )
    assert.match(
      gateway,
      /limit: 50/,
    )
  },
)

test(
  'Attendance A2 alta usa POST y retirada soft usa PATCH sin DELETE',
  () => {
    assert.match(
      gateway,
      /async addSessionAttendance\([\s\S]*\/attendances`[\s\S]*method: 'POST'/,
    )
    assert.match(
      gateway,
      /async removeSessionAttendance\([\s\S]*\/attendances\/\$\{characterId\}\/remove`[\s\S]*method: 'PATCH'/,
    )
    assert.doesNotMatch(
      gateway,
      /method: 'DELETE'[\s\S]{0,300}attendances|attendances[\s\S]{0,300}method: 'DELETE'/,
    )
  },
)
