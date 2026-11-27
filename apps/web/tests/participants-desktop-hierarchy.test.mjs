import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const component = readFileSync(resolve(here, '../src/features/chronicles/components/ChronicleParticipantsWorkspace.tsx'), 'utf8')
const styles = readFileSync(resolve(here, '../src/features/chronicles/components/chronicle-participants-workspace.css'), 'utf8')

test('el resumen del personaje pliega la gestión duplicada inicialmente en escritorio', () => {
  assert.match(component, /associationOpen \? 'Cerrar gestión' : 'Gestionar asociación'/)
  assert.match(component, /aria-expanded=\{isDesktopLayout \? associationOpen : undefined\}/)
  assert.match(component, /hidden=\{isDesktopLayout && !associationOpen\}/)
  assert.match(component, /participant-association-management/)
})

test('la gestión sigue visible en móvil y se conserva la acción de asociación existente', () => {
  assert.match(component, /else openCharacterAssociation\(\)/)
  assert.match(component, /hidden=\{isDesktopLayout && !associationOpen\}/)
})

test('la jerarquía añadida se limita a escritorio y conserva los acentos existentes', () => {
  const v1 = styles.slice(styles.indexOf('PARTICIPANTS_DESKTOP_HIERARCHY_V1'))
  assert.match(v1, /@media \(min-width: 1181px\)/)
  assert.match(v1, /participant-association-management/)
  assert.match(styles, /PARTICIPANTS_DESKTOP_VISUAL_V4/)
})
