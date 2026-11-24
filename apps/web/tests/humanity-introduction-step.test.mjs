import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const introduction = await readFile(
  new URL('../src/features/character-creation/components/HumanityIntroductionStep.tsx', import.meta.url),
  'utf8',
)
const wizard = await readFile(
  new URL('../src/features/character-creation/components/CharacterCreationWizard.tsx', import.meta.url),
  'utf8',
)
const humanityStep = await readFile(
  new URL('../src/features/character-creation/components/HumanityStep.tsx', import.meta.url),
  'utf8',
)
const styles = await readFile(
  new URL('../src/styles/character-creation.css', import.meta.url),
  'utf8',
)

test('la introducción explica Humanidad, Convicciones y Piedras de Toque', () => {
  for (const text of [
    'No es una puntuación de bondad',
    'frente a la Bestia',
    'Son reglas propias',
    'personas mortales que representan una Convicción',
    'de una a tres Convicciones',
    'peso en la crónica',
  ]) {
    assert.ok(introduction.replace(/\s+/g, ' ').includes(text), 'Falta explicación: ' + text)
  }
  assert.match(humanityStep, /Humanidad inicial/)
  assert.match(humanityStep, /vinculada a una Piedra/)
})

test('la introducción solo aparece antes de Humanidad en modo guiado y permite volver a abrirla', () => {
  assert.match(wizard, /journeyMode === 'guided' &&\s*currentStepId === 'humanity' &&\s*!hasCompletedHumanityIntroduction/)
  assert.match(wizard, /if \(humanityIntroductionActive\) \{[\s\S]*?setHasCompletedHumanityIntroduction\(true\)/)
  assert.match(wizard, /currentStepId === 'humanity' &&\s*hasCompletedHumanityIntroduction[\s\S]*?setHasCompletedHumanityIntroduction\(false\)/)
  assert.match(wizard, /<HumanityIntroductionStep/)
  assert.match(wizard, /Continuar: definir vínculos/)
})

test('la introducción mantiene el estilo adaptable de las demás fases', () => {
  assert.match(styles, /\.humanity-introduction__grid\s*\{[\s\S]*?grid-template-columns/)
  assert.match(styles, /@media \(max-width: 900px\)[\s\S]*?humanity-introduction__grid/)
})
