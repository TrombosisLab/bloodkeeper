import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const identityStep = await readFile(
  new URL('../src/features/character-creation/components/IdentityStep.tsx', import.meta.url),
  'utf8',
)
const characterCreationStyles = await readFile(
  new URL('../src/styles/character-creation.css', import.meta.url),
  'utf8',
)
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
  assert.doesNotMatch(startSelector, /Primero elegiste el recorrido|Ahora decide desde qué punto comienza la historia/)
  assert.match(startSelector, /Esta elección define si la historia empieza como vampiro/)
  assert.match(startSelector, /onSelect\('standard'\)/)
  assert.match(startSelector, /onSelect\('sessionZero'\)/)
  assert.match(startSelector, /onBackToJourney/)
})

test('los borradores existentes conservan su carga sin mostrar el nuevo selector', () => {
  assert.match(wizard, /if \(characterId !== null\)[\s\S]*?Cargando creación/)
  assert.match(wizard, /Recuperando el modo y el progreso guardados/)
})

test('Guiado y Directo conservan el mapa lateral de fases', () => {
  assert.match(wizard, /<aside className="creation-sidebar">/)
  assert.match(wizard, /<CreationProgress/)
  assert.match(wizard, /className="creation-layout"/)
  assert.match(wizard, /<div className="creation-layout">\s*<aside className="creation-sidebar">[\s\S]*?<CreationProgress/)
  assert.match(wizard, /creation-sidebar__heading/)
})

test('Guiado divide Identidad en pasos breves y Directo conserva el formulario completo', () => {
  assert.match(wizard, /guidedIdentityStages: GuidedIdentityStage\[\]/)
  assert.match(wizard, /setGuidedIdentityStage\(/)
  assert.match(wizard, /guidedStage=\{[\s\S]*?guidedIdentityStage/)
  assert.match(wizard, /Paso \$\{guidedIdentityStageIndex \+ 1\} de \$\{guidedIdentityStages.length\}/)
  assert.match(identityStep, /guidedStage === 'profile' \? 'Quién es/)
  assert.match(identityStep, /data-guided-stage=\{guidedStage \?\? "all"\}/)
  for (const group of ['profile', 'story', 'clan', 'predator', 'generation']) {
    assert.match(identityStep, new RegExp(`identity-guided-group--${group}`))
  }
  assert.match(wizard, /creationMode === 'sessionZero'[\s\S]*?\['profile', 'story'\]/)
  assert.match(wizard, /draft\.identity\.clan === 'thinBlood'[\s\S]*?\['profile', 'story', 'clan', 'generation'\]/)
  assert.match(wizard, /setGuidedIdentityErrors\(\[\]\)/)
})

test('Guiado valida las opciones del depredador en su paso y aplaza solo la generación', () => {
  assert.match(
    wizard,
    /guidedIdentityStage === 'predator'[\s\S]*?currentValidation\.errors\.filter\([\s\S]*?La generación es obligatoria/,
  )
})

test('la cuadrícula de Atributos se adapta antes de que sus controles se compriman', () => {
  assert.match(
    characterCreationStyles,
    /@media \(max-width: 1280px\)[\s\S]*?\.attributes-editor-grid \{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/,
  )
  assert.match(
    characterCreationStyles,
    /@media \(max-width: 980px\)[\s\S]*?\.attributes-editor-grid \{\s*grid-template-columns: 1fr/,
  )
})
