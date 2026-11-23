import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const introduction = await readFile(
  new URL('../src/features/character-creation/components/DisciplineIntroductionStep.tsx', import.meta.url),
  'utf8',
)
const wizard = await readFile(
  new URL('../src/features/character-creation/components/CharacterCreationWizard.tsx', import.meta.url),
  'utf8',
)
const styles = await readFile(
  new URL('../src/styles/character-creation.css', import.meta.url),
  'utf8',
)

test('la introducción explica el reparto 2 + 1, la elección de Poderes y las concesiones', () => {
  for (const text of [
    'Dos Disciplinas · 2 + 1',
    'dos puntos a una Disciplina',
    'Cada punto de una Disciplina requiere un Poder',
    'Tipo de Depredador',
    'no consume el reparto 2 + 1',
  ]) {
    assert.ok(introduction.replace(/\s+/g, ' ').includes(text), 'Falta explicación: ' + text)
  }
  assert.match(introduction, /clan\.kind === 'thinBlood'/)
  assert.match(introduction, /clan\.kind === 'caitiff'/)
})

test('la explicación solo aparece en modo guiado, antes del selector, y permite volver', () => {
  assert.match(wizard, /journeyMode === 'guided' &&\s*currentStepId === 'disciplines' &&\s*!hasCompletedDisciplinesIntroduction/)
  assert.match(wizard, /if \(disciplinesIntroductionActive\) \{[\s\S]*?setHasCompletedDisciplinesIntroduction\(true\)/)
  assert.match(wizard, /currentStepId === 'disciplines' &&\s*hasCompletedDisciplinesIntroduction[\s\S]*?setHasCompletedDisciplinesIntroduction\(false\)/)
  assert.match(wizard, /<DisciplineIntroductionStep/)
  assert.match(wizard, /Continuar: elegir Disciplinas/)
})

test('la pantalla introductoria se adapta a pantallas estrechas', () => {
  assert.match(styles, /\.discipline-introduction__grid\s*\{[\s\S]*?grid-template-columns/)
  assert.match(styles, /@media \(max-width: 700px\)[\s\S]*?discipline-introduction__grid/)
})
