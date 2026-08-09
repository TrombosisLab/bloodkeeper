import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'

import {
  characterAdvantageCatalog,
} from '@v5r/character-rules'

import {
  characterCoreLoresheetDefinitions,
  getCharacterCoreLoresheetDefinition,
} from '../src/features/character-creation/data/core-loresheet-definitions.ts'

test(
  'SPEC-026.L1 la Web deriva las Loresheets del catálogo compartido',
  () => {
    assert.equal(
      characterCoreLoresheetDefinitions.length,
      15,
    )

    assert.deepEqual(
      characterCoreLoresheetDefinitions,
      characterAdvantageCatalog.loresheets,
    )

    assert.notEqual(
      characterCoreLoresheetDefinitions,
      characterAdvantageCatalog.loresheets,
    )

    assert.notEqual(
      characterCoreLoresheetDefinitions[0],
      characterAdvantageCatalog.loresheets[0],
    )

    assert.equal(
      getCharacterCoreLoresheetDefinition(
        'descendant-of-helena',
      )?.requirements?.clanKeys?.[0],
      'toreador',
    )

    assert.equal(
      getCharacterCoreLoresheetDefinition(
        'descendant-of-hardestadt',
      )?.requirements?.clanKeys?.[0],
      'ventrue',
    )
  },
)

test(
  'SPEC-026.L1 elimina el catálogo textual duplicado de la Web',
  async () => {
    const source = await readFile(
      new URL(
        '../src/features/character-creation/data/core-loresheet-definitions.ts',
        import.meta.url,
      ),
      'utf8',
    )

    assert.match(
      source,
      /characterAdvantageCatalog\.loresheets/,
    )

    assert.match(
      source,
      /from '@v5r\/character-rules'/,
    )

    assert.doesNotMatch(
      source,
      /key:\s*'bahari'/,
    )

    assert.doesNotMatch(
      source,
      /key:\s*'golconda'/,
    )
  },
)
