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


test('el color separa escena, personaje, dados, sangre y notas solo en móvil', () => {
  for (const colorCue of [
    'rgba(41, 30, 27, .98)',
    'rgba(29, 41, 48, .97)',
    'rgba(59, 22, 31, .96)',
    'rgba(38, 27, 43, .96)',
    'rgba(24, 36, 42, .96)',
    'rgba(39, 33, 26, .96)',
    'rgba(46, 37, 26, .97)',
  ]) {
    assert.ok(mobileStyles.includes(colorCue), `Falta diferenciación cromática móvil: ${colorCue}`)
  }
  assert.match(mobileStyles, /#chronicle-section-play-panel \.chronicle-play-workspace__session-switcher/)
  assert.match(mobileStyles, /#chronicle-section-play-panel \.chronicle-play-workspace__hero/)
  assert.match(mobileStyles, /border-left: 3px solid #b79060/)
  assert.match(mobileStyles, /border-left-color: #6e9ba4/)
  assert.match(mobileStyles, /aria-label="Dados e historial de tiradas"/)
  assert.match(mobileStyles, /aria-label="Recursos de sangre"/)
  assert.match(mobileStyles, /aria-label="Notas e información de la sesión"/)
})

test('la etiqueta distingue repaso de sesión completada y los cambios quedan limitados a 620px', () => {
  assert.match(component, /session\?\.status === 'completed' \? 'ESCENA DESTACADA' : 'ESCENA ACTUAL'/)
  assert.match(styles, /\.chronicle-play-workspace__scene-label--mobile \{ display: none; \}/)
  assert.match(mobileStyles, /\.chronicle-play-workspace__scene-label--desktop \{ display: none; \}/)
  assert.match(mobileStyles, /\.chronicle-play-workspace__scene-label--mobile \{ display: block; \}/)
  assert.match(mobileStyles, /@media|chronicle-play-workspace__mobile-character/)
})
