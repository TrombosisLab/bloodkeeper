import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  characterAdvantageDefinitions,
} from '../src/features/character-creation/data/character-advantage-definitions.ts'
import {
  buildCharacterAdvantageReadModel,
} from '../src/features/character-sheet/domain/character-advantage-read-model.ts'

const rowSource = await readFile(
  new URL(
    '../src/features/character-sheet/components/RatedTraitRow.tsx',
    import.meta.url,
  ),
  'utf8',
)

test(
  '026-E distingue localizaciones en la naturaleza funcional',
  () => {
    const result =
      buildCharacterAdvantageReadModel(
        [
          {
            selectionId: 'haven-1',
            definitionKey: 'haven',
            category: 'background',
            rating: 2,
            origin: 'creation',
          },
        ],
        characterAdvantageDefinitions,
      )

    assert.equal(
      result.backgrounds[0].functionalType,
      'location',
    )
    assert.equal(
      result.backgrounds[0].functionalTypeLabel,
      'Localización',
    )
  },
)

test(
  '026-E traduce el origen y la referencia bibliográfica',
  () => {
    const result =
      buildCharacterAdvantageReadModel(
        [
          {
            selectionId: 'beautiful-1',
            definitionKey: 'beautiful',
            category: 'merit',
            rating: 2,
            origin: 'predatorType',
          },
        ],
        characterAdvantageDefinitions,
      )

    assert.equal(
      result.advantages[0].originLabel,
      'Tipo de Depredador',
    )
    assert.equal(
      result.advantages[0].sourceLabel,
      'Libro Básico',
    )
    assert.equal(
      result.advantages[0].sourcePage,
      179,
    )
  },
)

test(
  '026-E presenta detalles secundarios sin abandonar la ficha',
  () => {
    assert.match(
      rowSource,
      /<details className="rated-trait__details">/,
    )
    assert.match(
      rowSource,
      /trait\.categoryLabel/,
    )
    assert.match(
      rowSource,
      /trait\.functionalTypeLabel/,
    )
    assert.match(
      rowSource,
      /trait\.originLabel/,
    )
  },
)

test(
  '026-E identifica una referencia histórica no disponible',
  () => {
    assert.match(
      rowSource,
      /Referencia no disponible/,
    )
  },
)
