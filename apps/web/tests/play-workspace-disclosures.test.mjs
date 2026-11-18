import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile(new URL('../src/features/chronicles/components/ChroniclePlayWorkspace.tsx', import.meta.url), 'utf8')
const styles = await readFile(new URL('../src/features/chronicles/components/chronicle-play-workspace.css', import.meta.url), 'utf8')

test('Jugar mantiene visibles la sesión y la escena y pliega herramientas secundarias', () => {
  assert.match(source, /className="chronicle-play-workspace__session-switcher"/)
  assert.match(source, /<section className="chronicle-play-workspace__scene">/)
  assert.match(source, /<details className="chronicle-play-workspace__disclosure" aria-label="Dados e historial de tiradas">/)
  assert.match(source, /<details className="chronicle-play-workspace__disclosure" aria-label="Recursos de sangre">/)
  assert.match(source, /<details className="chronicle-play-workspace__disclosure" aria-label="Notas e información de la sesión">/)
  assert.doesNotMatch(source, /<details[^>]+open(?:\s|=|>)/)
})

test('hambre y cantidad de hallazgos siguen visibles antes de desplegar', () => {
  assert.match(source, /Hambre actual: \{hunger\} \/ 5/)
  assert.match(source, /\{notes\.sharedNotes\.length\} notas compartidas · \{discovered\.length\} elementos descubiertos/)
})

test('los avisos de notas permanecen visibles incluso con el bloque plegado', () => {
  assert.match(source, /\{notesError \? <p className="chronicle-play-workspace__notes-error" role="alert">\{notesError\}<\/p> : null\}\s*<details/)
})

test('los desplegables conservan foco visible y estilo responsive', () => {
  assert.match(styles, /BLOODKEEPER_PLAY_WORKSPACE_DISCLOSURES_V1_START/)
  assert.match(styles, /\.chronicle-play-workspace__disclosure > summary:focus-visible/)
  assert.match(styles, /@media \(max-width: 620px\)/)
})
