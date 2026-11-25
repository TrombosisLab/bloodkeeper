import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const component = readFileSync(new URL('../src/features/chronicles/components/ChroniclePlayWorkspace.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('../src/features/chronicles/components/chronicle-play-workspace.css', import.meta.url), 'utf8')
const mobileStart = styles.indexOf('@media (max-width: 620px) {')
const mobileEnd = styles.indexOf('/* BLOODKEEPER_PLAY_WORKSPACE_DISCLOSURES_V1_START */', mobileStart)
const mobileStyles = styles.slice(mobileStart, mobileEnd)

test('el resumen compacto del personaje solo se muestra en móvil y la ficha completa conserva su versión normal', () => {
  assert.match(component, /chronicle-play-workspace__mobile-character/)
  assert.match(component, /chronicle-play-workspace__character/)
  assert.match(styles, /\.chronicle-play-workspace__mobile-character \{ display: none; \}/)
  assert.match(mobileStyles, /\.chronicle-play-workspace__mobile-character \{\s*display: grid;/)
  assert.match(mobileStyles, /#chronicle-section-play-panel \.chronicle-play-workspace__character \{ display: none !important; \}/)
})

test('en móvil las referencias vacías se ocultan y las descripciones largas se compactan', () => {
  assert.match(component, /className=\{!npc\?\.name \? 'is-unlinked' : undefined\}/)
  assert.match(component, /className=\{!location\?\.name \? 'is-unlinked' : undefined\}/)
  assert.match(mobileStyles, /\.chronicle-play-workspace__scene-links article\.is-unlinked \{ display: none; \}/)
  assert.match(mobileStyles, /-webkit-line-clamp: 2;/)
})

test('la etiqueta distingue repaso de sesión completada y los cambios quedan limitados a 620px', () => {
  assert.match(component, /session\?\.status === 'completed' \? 'ESCENA DESTACADA' : 'ESCENA ACTUAL'/)
  assert.match(styles, /\.chronicle-play-workspace__scene-label--mobile \{ display: none; \}/)
  assert.match(mobileStyles, /\.chronicle-play-workspace__scene-label--desktop \{ display: none; \}/)
  assert.match(mobileStyles, /\.chronicle-play-workspace__scene-label--mobile \{ display: block; \}/)
  assert.match(mobileStyles, /@media|chronicle-play-workspace__mobile-character/)
})
