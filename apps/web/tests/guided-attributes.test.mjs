import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const attributesStep = await readFile(
  new URL('../src/features/character-creation/components/AttributesStep.tsx', import.meta.url),
  'utf8',
)
const styles = await readFile(
  new URL('../src/styles/character-creation.css', import.meta.url),
  'utf8',
)

test('el modo guiado recorre Atributos por grupos sin cambiar las reglas globales', () => {
  assert.match(attributesStep, /guided\?: boolean/)
  assert.match(attributesStep, /Grupo de Atributos/)
  assert.match(attributesStep, /Grupo anterior/)
  assert.match(attributesStep, /Siguiente grupo/)
  assert.match(attributesStep, /guided \? \[activeCategory\] : categories/)
  assert.match(attributesStep, /validateAttributeDistribution\(value\)/)
  assert.match(attributesStep, /Los puntos se reparten entre los tres grupos y se validan en conjunto/)
})

test('la navegación guiada usa los tokens visuales existentes y se adapta en móvil', () => {
  assert.match(styles, /\.attributes-step__guided-navigation/)
  assert.match(styles, /\.attributes-step__guided-category\[aria-pressed="true"\]/)
  assert.match(styles, /var\(--color-accent-active\)/)
  assert.match(styles, /@media \(max-width: 700px\)/)
})
