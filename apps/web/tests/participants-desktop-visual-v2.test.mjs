import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const styles = readFileSync(resolve(here, '../src/features/chronicles/components/chronicle-participants-workspace.css'), 'utf8')

test('el refuerzo visual v2 está limitado a escritorio y aumenta la distinción entre secciones', () => {
  assert.match(styles, /PARTICIPANTS_DESKTOP_VISUAL_V2/)
  const desktop = styles.slice(styles.indexOf('PARTICIPANTS_DESKTOP_VISUAL_V2'))
  assert.match(desktop, /@media \(min-width: 1181px\)/)
  assert.match(desktop, /border-left: 4px solid/)
  assert.match(desktop, /border-top: 2px solid/)
  for (const section of ['identity-data', 'character', 'participation', 'attendance', 'stories']) {
    assert.ok(desktop.includes(`.participant-card--${section}`), `falta contraste para ${section}`)
  }
})

test('la base v1 y el diseño para anchos menores se conservan', () => {
  assert.match(styles, /PARTICIPANTS_DESKTOP_VISUAL_V1/)
  const v2 = styles.slice(styles.indexOf('PARTICIPANTS_DESKTOP_VISUAL_V2'))
  assert.doesNotMatch(v2, /@media \(max-width:/)
})
