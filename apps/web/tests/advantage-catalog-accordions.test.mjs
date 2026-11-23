import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  filterAdvantageCatalogDefinitions,
  getAdvantageCatalogGroupLabel,
  groupAdvantageCatalogDefinitions,
} from '../src/features/character-creation/data/advantage-catalog-groups.ts'

const characterAdvantageDefinitions = JSON.parse(
  await readFile(
    new URL('../../../packages/character-rules/catalogs/advantages.json', import.meta.url),
    'utf8',
  ),
)

test('el catálogo se agrupa sin perder ni duplicar ningún mérito, defecto o trasfondo', () => {
  for (const category of ['background', 'merit', 'flaw']) {
    const definitions = characterAdvantageDefinitions.filter(
      (definition) => definition.category === category,
    )
    const grouped = groupAdvantageCatalogDefinitions(definitions)
    const groupedDefinitions = grouped.flatMap((group) => group.definitions)

    assert.equal(groupedDefinitions.length, definitions.length, category)
    assert.deepEqual(
      groupedDefinitions.map(({ key }) => key).sort(),
      definitions.map(({ key }) => key).sort(),
      category,
    )
  }
})

test('los subgrupos respetan las secciones del catálogo y agrupan los rasgos de Refugio', () => {
  const labels = new Set(
    characterAdvantageDefinitions.map(getAdvantageCatalogGroupLabel),
  )

  for (const label of ['Apariencia', 'Vínculo', 'Alimentación', 'Caitiff', 'Refugio']) {
    assert.ok(labels.has(label), `falta el subgrupo ${label}`)
  }
  assert.ok(!labels.has('Cultos'), 'el bloque de Cultos excluido no debe reaparecer')

  const havenDefinition = characterAdvantageDefinitions.find(
    (definition) => definition.key === 'haven',
  )
  assert.equal(getAdvantageCatalogGroupLabel(havenDefinition), 'Refugio')
  for (const key of ['commercial-establishment', 'furcus', 'mechanic-workshop', 'smuggler-cache', 'spare-plates']) {
    const definition = characterAdvantageDefinitions.find((item) => item.key === key)
    assert.equal(getAdvantageCatalogGroupLabel(definition), 'Refugio', key)
  }
})

test('la búsqueda ignora mayúsculas y tildes y encuentra por nombre o tipo', () => {
  assert.deepEqual(
    filterAdvantageCatalogDefinitions(characterAdvantageDefinitions, 'apariencia')
      .filter((definition) => definition.category === 'merit')
      .map(({ key }) => key),
    characterAdvantageDefinitions
      .filter((definition) => definition.category === 'merit' && getAdvantageCatalogGroupLabel(definition) === 'Apariencia')
      .map(({ key }) => key),
  )
  assert.ok(
    filterAdvantageCatalogDefinitions(characterAdvantageDefinitions, 'Sangre favorecida')
      .some((definition) => definition.key === 'caitiff-favored-blood'),
  )
})

test('el creador mantiene puntos, selección, búsqueda y acordeones accesibles también en móvil', async () => {
  const component = await readFile(
    new URL('../src/features/character-creation/components/AdvantagesStep.tsx', import.meta.url),
    'utf8',
  )
  const styles = await readFile(
    new URL('../src/styles/character-creation.css', import.meta.url),
    'utf8',
  )

  assert.match(component, /Buscar en Trasfondos, Méritos y Defectos/)
  assert.match(component, /Restablecer/)
  assert.match(component, /Seleccionados/)
  assert.match(component, /advantages-catalog-category/)
  assert.match(component, /advantages-catalog-subgroup/)
  assert.match(styles, /@media \(max-width: 760px\)[\s\S]*?\.advantages-catalog-category > summary/)
})

test('los contadores de subgrupo mantienen una columna alineada en escritorio y móvil', async () => {
  const styles = await readFile(
    new URL('../src/styles/character-creation.css', import.meta.url),
    'utf8',
  )

  assert.match(
    styles,
    /\.advantages-catalog-subgroup > summary\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\) minmax\(5\.5rem,\s*12rem\) 1rem;/,
  )
  assert.match(
    styles,
    /\.advantages-catalog-subgroup > summary small\s*\{[^}]*text-align:\s*right;/,
  )
  assert.match(
    styles,
    /@media \(max-width: 760px\)[\s\S]*?\.advantages-catalog-subgroup > summary\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\) minmax\(5\.5rem,\s*8rem\) 1rem;/,
  )
})
