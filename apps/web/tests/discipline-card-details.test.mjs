import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  disciplineDefinitions,
} from '../src/features/character-creation/data/discipline-definitions.ts'
import {
  disciplinePowerDefinitions,
} from '../src/features/character-creation/data/discipline-power-definitions.ts'
import {
  contentSources,
} from '../src/features/character-creation/data/content-sources.ts'
import {
  buildCharacterDisciplineReadModel,
} from '../src/features/character-sheet/domain/character-discipline-read-model.ts'

const card = await readFile(
  new URL(
    '../src/features/character-sheet/components/DisciplineCard.tsx',
    import.meta.url,
  ),
  'utf8',
)

const styles = await readFile(
  new URL(
    '../src/styles/character-sheet.css',
    import.meta.url,
  ),
  'utf8',
)

test(
  '025-E resuelve la fuente bibliográfica para presentación',
  () => {
    const result =
      buildCharacterDisciplineReadModel(
        [
          {
            key: 'celerity',
            value: 1,
            powerKeys: ['celerity-cats-grace'],
          },
        ],
        disciplineDefinitions,
        disciplinePowerDefinitions,
        contentSources,
      )

    assert.equal(
      result[0].powers[0].sourceName,
      'V5 Básico',
    )
    assert.equal(result[0].powers[0].sourcePage, 252)
  },
)

test(
  '025-E permite expandir cada Poder sin abandonar la ficha',
  () => {
    assert.match(card, /<details/)
    assert.match(card, /<summary>/)
    assert.match(card, /power\.summary/)
  },
)

test(
  '025-E muestra fuente y página sin reproducir textos extensos',
  () => {
    assert.match(card, /Fuente: {power\.sourceName}/)
    assert.match(card, /power\.sourcePage/)
    assert.match(
      card,
      /Sin información adicional autorizada/,
    )
  },
)

test(
  '025-E mantiene el control accesible por teclado y tacto',
  () => {
    assert.match(
      styles,
      /discipline-power-details summary[\s\S]*min-height: 44px/,
    )
    assert.match(
      styles,
      /discipline-power-details summary:focus-visible/,
    )
  },
)

test(
  '025-A1-M3 muestra mecánicas como información sin añadir ejecución',
  () => {
    assert.match(
      card,
      /power\.mechanics/,
    )
    assert.match(
      card,
      />Coste</,
    )
    assert.match(
      card,
      />Duración</,
    )
    assert.match(
      card,
      />Pruebas</,
    )
    assert.match(
      card,
      />Modificadores</,
    )
    assert.match(
      card,
      />Límites</,
    )

    assert.doesNotMatch(
      card,
      /Usar Poder/,
    )
    assert.doesNotMatch(
      card,
      /rouseCheck|performRouse|disciplinePowerLevel/,
    )
  },
)

test(
  '025-A1-M3 mantiene las mecánicas dentro del details accesible existente',
  () => {
    assert.match(
      card,
      /<details className="discipline-power-details">[\s\S]*discipline-power-mechanics/,
    )
  },
)

test(
  '025-A1-M3 añade layout responsive para hechos mecánicos',
  () => {
    assert.match(
      styles,
      /\.discipline-power-mechanics__facts[\s\S]*grid-template-columns:/,
    )
    assert.match(
      styles,
      /@media \(max-width: 700px\)[\s\S]*\.discipline-power-mechanics__facts[\s\S]*grid-template-columns: 1fr/,
    )
  },
)

test(
  '025-A1-M3 prioriza el resumen mecánico y evita duplicar descripciones',
  () => {
    assert.match(
      card,
      /power\.mechanics\?\.systemSummary/,
    )
    assert.match(
      card,
      /power\.mechanics\.systemSummary/,
    )
    assert.match(
      card,
      /: power\.summary \?/,
    )

    assert.doesNotMatch(
      card,
      /discipline-power-mechanics__summary/,
    )
    assert.doesNotMatch(
      styles,
      /\.discipline-power-mechanics__summary/,
    )
  },
)
