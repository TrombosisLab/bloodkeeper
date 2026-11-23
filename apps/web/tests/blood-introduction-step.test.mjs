import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const introduction = await readFile(
  new URL('../src/features/character-creation/components/BloodIntroductionStep.tsx', import.meta.url),
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

test('la introducción de Sangre aclara decisiones, límites y valores automáticos', () => {
  for (const text of [
    'Generación',
    'rango permitido',
    'Potencia de Sangre',
    'El Hambre va de 0 a 5',
    'valor inicial',
    'Salud y Fuerza de Voluntad',
    'se calcula con Resistencia',
  ]) {
    assert.ok(introduction.replace(/\s+/g, ' ').includes(text), 'Falta explicación: ' + text)
  }
  assert.match(introduction, /getBloodPotencyRange/)
  assert.match(introduction, /bloodPotency/)
  assert.match(introduction, /hunger/)
})

test('la explicación solo aparece antes de Sangre en el recorrido guiado y permite volver', () => {
  assert.match(wizard, /journeyMode === 'guided' &&\s*currentStepId === 'blood' &&\s*!hasCompletedBloodIntroduction/)
  assert.match(wizard, /if \(bloodIntroductionActive\) \{[\s\S]*?setHasCompletedBloodIntroduction\(true\)/)
  assert.match(wizard, /currentStepId === 'blood' &&\s*hasCompletedBloodIntroduction[\s\S]*?setHasCompletedBloodIntroduction\(false\)/)
  assert.match(wizard, /<BloodIntroductionStep/)
  assert.match(wizard, /Continuar: ajustar Sangre/)
})

test('la pantalla introductoria mantiene un diseño adaptable', () => {
  assert.match(styles, /\.blood-introduction__grid\s*\{[\s\S]*?grid-template-columns/)
  assert.match(styles, /@media \(max-width: 700px\)[\s\S]*?blood-introduction__grid/)
})
