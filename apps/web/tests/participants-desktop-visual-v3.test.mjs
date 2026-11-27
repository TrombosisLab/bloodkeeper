import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const component = readFileSync(resolve(here, '../src/features/chronicles/components/ChronicleParticipantsWorkspace.tsx'), 'utf8')
const styles = readFileSync(resolve(here, '../src/features/chronicles/components/chronicle-participants-workspace.css'), 'utf8')

test('asistencia se consulta también para jugadores, no solo para narradores', () => {
  assert.match(component, /const attendancePages = character === null\s*\? \[\]/)
  assert.doesNotMatch(component, /const attendancePages = character === null \|\| !canManage/)
  assert.match(component, /gateway\.sessionAttendances\(selected\.chronicleId, session\.id\)/)
})

test('las superficies diferenciadas solo se aplican en escritorio', () => {
  const v3 = styles.slice(styles.indexOf('PARTICIPANTS_DESKTOP_VISUAL_V3'))
  assert.match(v3, /@media \(min-width: 1181px\)/)
  for (const color of ['#211c12', '#14201e', '#201b12', '#241519', '#1e1925']) {
    assert.ok(v3.includes(color), `falta superficie ${color}`)
  }
  assert.doesNotMatch(v3, /@media \(max-width:/)
})
