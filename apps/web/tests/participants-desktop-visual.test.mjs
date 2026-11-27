import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const component = readFileSync(resolve(here, '../src/features/chronicles/components/ChronicleParticipantsWorkspace.tsx'), 'utf8')
const styles = readFileSync(resolve(here, '../src/features/chronicles/components/chronicle-participants-workspace.css'), 'utf8')

test('Participantes integra estado y PX junto al personaje en escritorio', () => {
  assert.match(component, /participant-character-facts[\s\S]*?Estado[\s\S]*?PX disponibles/)
  assert.match(styles, /@media \(min-width: 1181px\)[\s\S]*?participant-card--character-status \{ display: none; \}/)
})

test('el mensaje sin historias se compacta y las tarjetas reciben acentos semánticos', () => {
  assert.match(component, /participant-card--stories\$\{involvedStories\.length === 0 \? ' is-empty'/)
  assert.match(styles, /participant-card--stories\.is-empty \.participant-empty/)
  for (const section of ['identity-data', 'character', 'participation', 'attendance', 'stories']) {
    assert.ok(styles.includes(`.participant-card--${section}`), `falta acento para ${section}`)
  }
})

test('los cambios de Participantes solo se activan en escritorio', () => {
  assert.match(styles, /participant-character-facts \{ display: none; \}[\s\S]*?@media \(min-width: 1181px\)/)
})
