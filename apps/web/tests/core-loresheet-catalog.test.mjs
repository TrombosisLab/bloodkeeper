import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterCoreLoresheetDefinitions,
  getCharacterCoreLoresheetDefinition,
} from '../src/features/character-creation/data/core-loresheet-definitions.ts'

import {
  validateCharacterLoresheetDefinitions,
} from '../src/features/character-creation/domain/loresheet-definition-rules.ts'

test(
  'el catálogo Core de Fichas de Conocimientos es estructuralmente válido',
  () => {
    const result =
      validateCharacterLoresheetDefinitions(
        characterCoreLoresheetDefinitions,
      )

    assert.equal(
      result.valid,
      true,
    )

    assert.deepEqual(
      result.errors,
      [],
    )
  },
)

test(
  'el catálogo Core contiene únicamente las Fichas Core implementadas',
  () => {
    assert.deepEqual(
      characterCoreLoresheetDefinitions.map(
        (definition) =>
          definition.key,
      ),
      [
        'golconda',
      ],
    )
  },
)

test(
  'el lookup Core devuelve null para una clave inexistente',
  () => {
    assert.equal(
      getCharacterCoreLoresheetDefinition(
        'missing',
      ),
      null,
    )
  },
)

test(
  'todas las futuras definiciones del catálogo dedicado deberán pertenecer a fuente core',
  () => {
    assert.equal(
      characterCoreLoresheetDefinitions.every(
        (definition) =>
          definition.source === 'core',
      ),
      true,
    )
  },
)

test(
  'Golconda está registrada como Ficha de Conocimientos Core de la página 389',
  () => {
    const definition =
      getCharacterCoreLoresheetDefinition(
        'golconda',
      )

    assert.ok(definition)

    assert.equal(
      definition.name,
      'Golconda',
    )

    assert.equal(
      definition.source,
      'core',
    )

    assert.equal(
      definition.sourcePage,
      389,
    )
  },
)

test(
  'Golconda contiene exactamente sus cinco niveles Core',
  () => {
    const definition =
      getCharacterCoreLoresheetDefinition(
        'golconda',
      )

    assert.ok(definition)

    assert.deepEqual(
      definition.benefits.map(
        (benefit) => ({
          name:
            benefit.name,
          level:
            benefit.level,
        }),
      ),
      [
        {
          name:
            'Semillas de Golconda',
          level: 1,
        },
        {
          name:
            'El Único Camino Verdadero',
          level: 2,
        },
        {
          name:
            'Discípulo de Saulot',
          level: 3,
        },
        {
          name:
            'Satisfacer el Ansia',
          level: 4,
        },
        {
          name:
            'Recibir al Sol',
          level: 5,
        },
      ],
    )
  },
)

test(
  'el lookup Core localiza Golconda por su clave estable',
  () => {
    assert.equal(
      getCharacterCoreLoresheetDefinition(
        'golconda',
      )?.key,
      'golconda',
    )

    assert.equal(
      getCharacterCoreLoresheetDefinition(
        'missing',
      ),
      null,
    )
  },
)
