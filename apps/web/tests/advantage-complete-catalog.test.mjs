import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterAdvantageDefinitions,
} from '../src/features/character-creation/data/character-advantage-definitions.ts'

import {
  validateCharacterAdvantageDefinitions,
} from '../src/features/character-creation/domain/advantage-definition-rules.ts'


test(
  'el catálogo completo de Ventajas Core es válido',
  () => {
    const result =
      validateCharacterAdvantageDefinitions(
        characterAdvantageDefinitions,
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
  'las claves del catálogo completo son únicas',
  () => {
    const keys =
      characterAdvantageDefinitions.map(
        (definition) =>
          definition.key,
      )

    assert.equal(
      new Set(keys).size,
      keys.length,
    )
  },
)
