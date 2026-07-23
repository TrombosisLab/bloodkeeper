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
  'el catálogo Core está separado de suplementos y puede iniciarse vacío',
  () => {
    assert.deepEqual(
      characterCoreLoresheetDefinitions,
      [],
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
