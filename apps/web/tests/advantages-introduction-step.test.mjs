import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const introduction = await readFile(
  new URL('../src/features/character-creation/components/AdvantagesIntroductionStep.tsx', import.meta.url),
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

test('la introducción distingue Ventajas, Méritos, Trasfondos y Defectos', () => {
  for (const text of [
    '“Ventajas” es el nombre general',
    'Méritos y Trasfondos',
    'cualidades, aptitudes o particularidades',
    'recursos y relaciones externas',
    'otros afectan a un Trasfondo',
    'El catálogo indicará el coste y las reglas de cada opción.',
  ]) {
    assert.ok(introduction.replace(/\s+/g, ' ').includes(text), 'Falta explicación: ' + text)
  }
  assert.match(introduction, /profileNature === 'vampire'/)
})

test('la introducción solo se interpone en el recorrido guiado y se puede volver a abrir', () => {
  assert.match(wizard, /journeyMode === 'guided' &&\s*currentStepId === 'advantages' &&\s*!hasCompletedAdvantagesIntroduction/)
  assert.match(wizard, /if \(advantagesIntroductionActive\) \{[\s\S]*?setHasCompletedAdvantagesIntroduction\(true\)/)
  assert.match(wizard, /currentStepId === 'advantages' &&\s*hasCompletedAdvantagesIntroduction[\s\S]*?setHasCompletedAdvantagesIntroduction\(false\)/)
  assert.match(wizard, /<AdvantagesIntroductionStep/)
  assert.match(wizard, /Continuar: abrir catálogo/)
})

test('la pantalla introductoria se adapta a pantallas estrechas', () => {
  assert.match(styles, /\.advantages-introduction__grid\s*\{[\s\S]*?grid-template-columns/)
  assert.match(styles, /@media \(max-width: 700px\)[\s\S]*?advantages-introduction__grid/)
})
