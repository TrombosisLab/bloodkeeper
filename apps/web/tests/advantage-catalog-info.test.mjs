import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import { advantageCatalogHelp } from '../src/features/character-creation/data/advantage-catalog-help.ts'

const definitions = JSON.parse(
  await readFile(
    new URL('../../../packages/character-rules/catalogs/advantages.json', import.meta.url),
    'utf8',
  ),
)

test('cada rasgo del catálogo tiene ayuda breve fuera del catálogo de reglas', () => {
  const keys = new Set(definitions.map(({ key }) => key))
  assert.equal(Object.keys(advantageCatalogHelp).length, definitions.length)

  for (const definition of definitions) {
    assert.ok(keys.has(definition.key), `la ayuda debe usar una clave vigente: ${definition.key}`)
    assert.ok(
      advantageCatalogHelp[definition.key]?.trim().length > 20,
      `falta una explicación útil para ${definition.key}`,
    )
  }
  for (const key of Object.keys(advantageCatalogHelp)) {
    assert.ok(keys.has(key), `la ayuda no debe incluir claves ajenas al catálogo: ${key}`)
  }
})

test('la interfaz carga la ayuda bajo demanda y la ventana es accesible y adaptable', async () => {
  const component = await readFile(
    new URL('../src/features/character-creation/components/AdvantagesStep.tsx', import.meta.url),
    'utf8',
  )
  const dialog = await readFile(
    new URL('../src/features/character-creation/components/advantages/AdvantageCatalogInfoDialog.tsx', import.meta.url),
    'utf8',
  )
  const styles = await readFile(
    new URL('../src/styles/character-creation.css', import.meta.url),
    'utf8',
  )

  assert.match(component, /import\(\s*['"]\.\.\/data\/advantage-catalog-help['"]\s*\)/)
  assert.match(component, /aria-label=\{`Información sobre \$\{definition\.name\}`\}/)
  assert.match(component, /<AdvantageCatalogInfoDialog/)
  assert.match(dialog, /showModal\(\)/)
  assert.match(dialog, /aria-labelledby=/)
  assert.match(dialog, /¿Qué hace\?/)
  assert.match(dialog, /onCancel=/)
  assert.match(styles, /\.advantage-info-dialog::backdrop/)
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*?\.advantage-info-dialog\s*\{[^}]*width: calc\(100vw - 1rem\)/)
})
