import assert from 'node:assert/strict'
import test from 'node:test'

import { readFile } from 'node:fs/promises'

import {
  characterDependencyCatalog,
} from '@v5r/character-rules'

import {
  predatorTypeDefinitions,
} from '../src/features/character-creation/data/predator-type-definitions.ts'

test(
  '029-T la web resuelve Tipos de Depredador desde el paquete compartido',
  () => {
    assert.deepEqual(
      predatorTypeDefinitions.map(
        (definition) => definition.key,
      ),
      characterDependencyCatalog.predatorTypes.map(
        (definition) => definition.key,
      ),
    )
    assert.equal(predatorTypeDefinitions.length, 10)
  },
)

test(
  '029-T la interfaz recibe copias sin mutar la fuente compartida',
  () => {
    const original =
      characterDependencyCatalog.predatorTypes[0].name

    predatorTypeDefinitions[0].name = 'Cambio local'

    assert.equal(
      characterDependencyCatalog.predatorTypes[0].name,
      original,
    )

    predatorTypeDefinitions[0].name = original
  },
)

test(
  '029-T elimina la definicion duplicada del frontend',
  async () => {
    const source = await readFile(
      new URL(
        '../src/features/character-creation/data/predator-type-definitions.ts',
        import.meta.url,
      ),
      'utf8',
    )

    assert.match(
      source,
      /characterDependencyCatalog\.predatorTypes/,
    )
    assert.doesNotMatch(
      source,
      /key:\s*['"]bagger['"]/,
    )
  },
)
