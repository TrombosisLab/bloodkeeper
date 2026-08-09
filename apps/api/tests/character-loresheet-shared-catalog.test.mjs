import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterAdvantageCatalog,
} from '@v5r/character-rules'

test(
  'SPEC-026.L1 publica las 15 Loresheets Core desde el catálogo compartido',
  () => {
    const loresheets =
      characterAdvantageCatalog.loresheets

    assert.equal(loresheets.length, 15)

    assert.equal(
      loresheets.reduce(
        (total, definition) =>
          total + definition.benefits.length,
        0,
      ),
      75,
    )

    assert.equal(
      new Set(
        loresheets.map(
          (definition) => definition.key,
        ),
      ).size,
      15,
    )

    for (const definition of loresheets) {
      assert.equal(
        definition.source,
        'core',
      )

      assert.deepEqual(
        definition.benefits.map(
          (benefit) => benefit.level,
        ),
        [1, 2, 3, 4, 5],
      )
    }
  },
)

test(
  'SPEC-026.L1 el catálogo compartido de Loresheets es inmutable',
  () => {
    assert.equal(
      Object.isFrozen(
        characterAdvantageCatalog.loresheets,
      ),
      true,
    )

    assert.equal(
      Object.isFrozen(
        characterAdvantageCatalog.loresheets[0],
      ),
      true,
    )

    assert.equal(
      Object.isFrozen(
        characterAdvantageCatalog.loresheets[0]
          .benefits,
      ),
      true,
    )

    assert.equal(
      Object.isFrozen(
        characterAdvantageCatalog.loresheets[0]
          .benefits[0],
      ),
      true,
    )
  },
)
