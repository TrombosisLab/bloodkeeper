import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const wizard = await readFile(
  new URL('../src/features/character-creation/components/CharacterCreationWizard.tsx', import.meta.url),
  'utf8',
)
const journeySelector = await readFile(
  new URL('../src/features/character-creation/components/CharacterCreationJourneySelector.tsx', import.meta.url),
  'utf8',
)
const startSelector = await readFile(
  new URL('../src/features/character-creation/components/CharacterCreationModeSelector.tsx', import.meta.url),
  'utf8',
)

test('la creación nueva ofrece primero recorrido guiado o directo', () => {
  assert.match(journeySelector, /onSelect\('guided'\)/)
  assert.match(journeySelector, /onSelect\('direct'\)/)
  assert.match(journeySelector, /mismas reglas y opciones/)
  assert.ok(wizard.indexOf('<CharacterCreationJourneySelector') < wizard.indexOf('<CharacterCreationModeSelector'))
  assert.match(wizard, /journeyMode === null/)
})

test('la selección de recorrido precede a la elección vampiro o Sesión 0', () => {
  assert.match(startSelector, /journeyMode === 'guided' \? 'Guiado' : 'Directo'/)
  assert.match(startSelector, /onSelect\('standard'\)/)
  assert.match(startSelector, /onSelect\('sessionZero'\)/)
  assert.match(startSelector, /onBackToJourney/)
})

test('los borradores existentes conservan su carga sin mostrar el nuevo selector', () => {
  assert.match(wizard, /if \(characterId !== null\)[\s\S]*?Cargando creación/)
  assert.match(wizard, /Recuperando el modo y el progreso guardados/)
})

test('Guiado oculta el mapa libre de fases y Directo lo conserva', () => {
  assert.match(wizard, /journeyMode !== 'guided' \? \([\s\S]*?<CreationProgress/)
  assert.match(wizard, /creation-layout--guided/)
  assert.match(wizard, /Avanza una fase cada vez/)
  assert.match(journeySelector, /mapa de fases/)
})
