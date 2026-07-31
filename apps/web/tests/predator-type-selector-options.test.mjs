import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

import {
  predatorTypeDefinitions,
} from '../src/features/character-creation/data/predator-type-definitions.ts'

import {
  getPredatorTypeOptions,
} from '../src/features/character-creation/domain/predator-type-rules.ts'

test(
  '003-K.5 genera las opciones del selector desde el catálogo canónico',
  () => {
    const options = getPredatorTypeOptions()

    assert.deepEqual(
      options,
      predatorTypeDefinitions.map(
        (definition) => ({
          value: definition.key,
          label: definition.name,
        }),
      ),
    )

    assert.equal(
      options.length,
      predatorTypeDefinitions.length,
    )

    assert.equal(options.length, 10)
  },
)

test(
  '003-K.5 usa claves internas y nombres visibles separados',
  () => {
    const options = getPredatorTypeOptions()

    assert.deepEqual(
      options.find(
        (option) =>
          option.value === 'bagger',
      ),
      {
        value: 'bagger',
        label: 'Bolsero',
      },
    )

    assert.deepEqual(
      options.find(
        (option) =>
          option.value === 'alleycat',
      ),
      {
        value: 'alleycat',
        label: 'Gato Callejero',
      },
    )

    assert.deepEqual(
      options.find(
        (option) =>
          option.value === 'scene-queen',
      ),
      {
        value: 'scene-queen',
        label: 'Reina del Ambiente',
      },
    )

    assert.deepEqual(
      options.find(
        (option) =>
          option.value === 'siren',
      ),
      {
        value: 'siren',
        label: 'Sirena',
      },
    )
  },
)

test(
  '003-K.5 identity-options no mantiene un catálogo duplicado',
  async () => {
    const source = await readFile(
      new URL(
        '../src/features/character-creation/data/identity-options.ts',
        import.meta.url,
      ),
      'utf8',
    )

    assert.doesNotMatch(
      source,
      /predatorTypeOptions/,
    )

    assert.match(
      source,
      /generationOptions/,
    )
  },
)

test(
  '003-K.5 IdentityStep consume la API pública del módulo',
  async () => {
    const source = await readFile(
      new URL(
        '../src/features/character-creation/components/IdentityStep.tsx',
        import.meta.url,
      ),
      'utf8',
    )

    assert.match(
      source,
      /getPredatorTypeOptions/,
    )

    assert.match(
      source,
      /value=\{option\.value\}/,
    )

    assert.match(
      source,
      /\{option\.label\}/,
    )

    assert.doesNotMatch(
      source,
      /predatorTypeOptions[\s\S]*from '\.\.\/data\/identity-options'/,
    )
  },
)
