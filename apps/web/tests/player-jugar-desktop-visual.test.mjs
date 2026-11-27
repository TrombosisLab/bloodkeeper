import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const workspace = await readFile(
  new URL('../src/features/chronicles/components/ChroniclePlayWorkspace.tsx', import.meta.url),
  'utf8',
)
const styles = await readFile(
  new URL('../src/features/chronicles/components/chronicle-play-workspace.css', import.meta.url),
  'utf8',
)

test('la escena gana jerarquía en escritorio y la sesión no se repite como título visible', () => {
  assert.match(workspace, /aria-labelledby="chronicle-play-title"/)
  assert.match(workspace, /<h1 id="chronicle-play-title">\{sessionTitle\(session\)\}<\/h1>/)
  assert.match(workspace, /chronicle-play-workspace__scene-title--desktop/)
  assert.match(styles, /@media \(min-width: 1321px\)/)
  assert.match(styles, /JUGAR_DESKTOP_VISUAL_HIERARCHY_V1_START/)
  assert.match(styles, /\.chronicle-play-workspace__hero-title\s*\{[^}]*clip-path:\s*inset\(50%\)/s)
})

test('la jerarquía oculta solo contexto vacío y conserva el contenido útil de la escena', () => {
  assert.match(workspace, /situation-location\$\{location\?\.name \? '' : ' is-unlinked'\}/)
  assert.match(styles, /\.chronicle-play-workspace__scene-links article\.is-unlinked\s*\{\s*display:\s*none;/)
  assert.match(workspace, /PISTA \/ DOCUMENTO/)
  assert.match(workspace, /ORGANIZACIÓN VINCULADA/)
})

test('las tres áreas plegables se distinguen por color en escritorio', () => {
  assert.match(styles, /Dados e historial de tiradas[\s\S]*?background: linear-gradient/)
  assert.match(styles, /Recursos de sangre[\s\S]*?background: linear-gradient/)
  assert.match(styles, /Notas e información de la sesión[\s\S]*?background: linear-gradient/)
})

test('los estilos de escritorio se limitan al espacio de Jugar y se conservan las reglas móviles', () => {
  assert.match(styles, /@media \(max-width: 620px\)/)
  assert.match(styles, /#chronicle-section-play-panel \.chronicle-play-workspace__character/)
  assert.match(styles, /JUGAR_DESKTOP_VISUAL_HIERARCHY_V1_END/)
})
