import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { disciplineCatalogHelp } from '../src/features/character-creation/data/discipline-catalog-help.ts'

const disciplineCatalog = JSON.parse(
  await readFile(
    new URL('../../../packages/character-rules/catalogs/disciplines.json', import.meta.url),
    'utf8',
  ),
)
const powerCatalog = JSON.parse(
  await readFile(
    new URL('../../../packages/character-rules/catalogs/discipline-powers.json', import.meta.url),
    'utf8',
  ),
)

const disciplineStep = await readFile(
  new URL('../src/features/character-creation/components/DisciplinesStep.tsx', import.meta.url),
  'utf8',
)
const powerSelector = await readFile(
  new URL('../src/features/character-creation/components/DisciplinePowerSelector.tsx', import.meta.url),
  'utf8',
)
const infoDialog = await readFile(
  new URL('../src/features/character-creation/components/DisciplineCatalogInfoDialog.tsx', import.meta.url),
  'utf8',
)
const styles = await readFile(
  new URL('../src/styles/character-creation.css', import.meta.url),
  'utf8',
)

test('cada Disciplina tiene una descripción de ayuda fuera del catálogo de reglas', () => {
  const keys = new Set(disciplineCatalog.map(({ key }) => key))
  assert.deepEqual(Object.keys(disciplineCatalogHelp).sort(), [...keys].sort())
  for (const [key, description] of Object.entries(disciplineCatalogHelp)) {
    assert.ok(description.trim().length > 35, `la descripción de ${key} debe orientar al jugador`)
  }
})

test('todos los Poderes muestran ayuda a partir del resumen y mecánicas ya catalogados', () => {
  const powers = powerCatalog
  assert.ok(powers.length > 0)
  assert.ok(powers.every(({ summary, mechanics, sourcePage }) => summary?.trim() && mechanics?.systemSummary?.trim() && sourcePage))
  assert.match(powerSelector, /aria-label=\{`Información sobre \$\{power\.name\}`\}/)
  assert.match(powerSelector, /summary=\{infoPower\.summary/)
  assert.match(powerSelector, /detail=\{infoPower\.mechanics\?\.systemSummary\}/)
  assert.match(powerSelector, /sourcePage=\{infoPower\.sourcePage\}/)
})

test('la ayuda conserva selección independiente, accesibilidad y diseño adaptable', () => {
  assert.match(disciplineStep, /onInfo=\{\(\) => setInfoDisciplineKey\(disciplineKey\)\}/)
  assert.match(disciplineStep, /¿Qué es la Alquimia de Sangre Débil\?/)
  assert.match(infoDialog, /showModal\(\)/)
  assert.match(infoDialog, /aria-labelledby=/)
  assert.match(infoDialog, /aria-describedby=/)
  assert.match(infoDialog, /onCancel=/)
  assert.match(styles, /\.discipline-power-option-card\s*\{[^}]*position: relative/s)
  assert.match(styles, /@media \(max-width: 850px\)[\s\S]*?\.discipline-power-selector__options/)
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*?\.advantage-info-dialog\s*\{[^}]*width: calc\(100vw - 1rem\)/)
})
