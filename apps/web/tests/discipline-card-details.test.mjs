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
