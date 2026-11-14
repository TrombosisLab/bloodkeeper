import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

const advantagesStep = readFileSync(
  new URL('../src/features/character-creation/components/AdvantagesStep.tsx', import.meta.url),
  'utf8',
)
const styles = readFileSync(
  new URL('../src/styles/character-creation.css', import.meta.url),
  'utf8',
)

test('las ventajas de valor fijo se seleccionan o quitan sin controles de nivel', () => {
  assert.match(advantagesStep, /Valor fijo · \{rating\}/)
  assert.match(advantagesStep, /Seleccionar/)
  assert.match(advantagesStep, /Seleccionada · \{selected\.rating\}/)
  assert.match(advantagesStep, />\s*Quitar\s*</)
  assert.match(advantagesStep, /fixedRating =\s*definition\.allowedRatings\.length === 1/)
})

test('la selección fija se distingue visualmente con borde y estado destacado', () => {
  assert.match(styles, /\.advantage-sheet-entry\.advantage-sheet-entry--selected\s*\{[^}]*border-color:[^}]*box-shadow:/s)
  assert.match(styles, /\.advantage-fixed-rating-control--selected[\s\S]*?color: var\(--color-accent\)/)
})
