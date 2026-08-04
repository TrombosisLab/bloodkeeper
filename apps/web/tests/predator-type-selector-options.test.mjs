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
      options.map(
        option =>
          option.value,
      ),
      predatorTypeDefinitions.map(
        definition =>
          definition.key,
      ),
    )

    assert.deepEqual(
      options.map(
        option =>
          option.label.replace(
            / \((Violento|Sociable|Invisible|Limitante)\)$/,
            '',
          ),
      ),
      predatorTypeDefinitions.map(
        definition =>
          definition.name,
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
        label: 'Bolsero (Limitante)',
      },
    )

    assert.deepEqual(
      options.find(
        (option) =>
          option.value === 'alleycat',
      ),
      {
        value: 'alleycat',
        label: 'Gato Callejero (Violento)',
      },
    )

    assert.deepEqual(
      options.find(
        (option) =>
          option.value === 'scene-queen',
      ),
      {
        value: 'scene-queen',
        label: 'Reina del Ambiente (Sociable)',
      },
    )

    assert.deepEqual(
      options.find(
        (option) =>
          option.value === 'siren',
      ),
      {
        value: 'siren',
        label: 'Sirena (Sociable)',
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


test(
  '029-U.14 muestra el contexto visual de los diez Tipos de Depredador Core',
  async () => {
    const {
      getPredatorTypeOptions,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    const labelsByKey =
      Object.fromEntries(
        getPredatorTypeOptions().map(
          option => [
            option.value,
            option.label,
          ],
        ),
      )

    assert.deepEqual(
      labelsByKey,
      {
        bagger:
          'Bolsero (Limitante)',

        osiris:
          'Osiris (Sociable)',

        sandman:
          'Sandman (Invisible)',

        'scene-queen':
          'Reina del Ambiente (Sociable)',

        siren:
          'Sirena (Sociable)',

        'blood-leech':
          'Sanguijuela (Limitante)',

        cleaver:
          'Cleaver (Sociable)',

        consensualist:
          'Consensualista (Sociable)',

        alleycat:
          'Gato Callejero (Violento)',

        farmer:
          'Granjero (Limitante)',
      },
    )
  },
)

test(
  '029-U.14 conserva las claves internas del selector',
  async () => {
    const {
      getPredatorTypeOptions,
    } = await import(
      '../src/features/character-creation/domain/predator-type-rules.ts'
    )

    assert.deepEqual(
      getPredatorTypeOptions().map(
        option =>
          option.value,
      ),
      [
        'bagger',
        'osiris',
        'sandman',
        'scene-queen',
        'siren',
        'blood-leech',
        'cleaver',
        'consensualist',
        'alleycat',
        'farmer',
      ],
    )
  },
)
