import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

import {
  characterAdvantageCatalog,
} from '@v5r/character-rules'

import {
  characterAdvantageDefinitions,
  getCharacterAdvantageDefinition,
  getCharacterAdvantageDefinitionsByCategory,
} from '../src/features/character-creation/data/character-advantage-definitions.ts'

test(
  '029-S la web resuelve Ventajas desde el paquete compartido',
  () => {
    assert.equal(
      characterAdvantageDefinitions.length,
      characterAdvantageCatalog.definitions.length,
    )
    assert.deepEqual(
      characterAdvantageDefinitions,
      characterAdvantageCatalog.definitions,
    )
    assert.equal(
      getCharacterAdvantageDefinition('resources')
        ?.name,
      'Recursos',
    )
    assert.equal(
      getCharacterAdvantageDefinitionsByCategory(
        'background',
      ).length,
      12,
    )
  },
)

test(
  '029-S la interfaz recibe copias sin mutar la fuente compartida',
  () => {
    assert.notEqual(
      characterAdvantageDefinitions,
      characterAdvantageCatalog.definitions,
    )
    assert.notEqual(
      characterAdvantageDefinitions[0],
      characterAdvantageCatalog.definitions[0],
    )

    const originalName =
      characterAdvantageCatalog.definitions[0].name

    characterAdvantageDefinitions[0].name =
      'Cambio local de prueba'

    assert.equal(
      characterAdvantageCatalog.definitions[0].name,
      originalName,
    )
  },
)

test(
  '029-S elimina la definicion duplicada del frontend',
  async () => {
    const source = await readFile(
      new URL(
        '../src/features/character-creation/data/character-advantage-definitions.ts',
        import.meta.url,
      ),
      'utf8',
    )

    assert.match(
      source,
      /from '@v5r\/character-rules'/,
    )
    assert.doesNotMatch(
      source,
      /sourceCharacterAdvantageDefinitions/,
    )
  },
)
