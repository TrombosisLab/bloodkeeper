import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterDependencyCatalog,
} from '@v5r/character-rules'

test(
  '057-E3C1 catálogo compartido contiene los 16 rasgos Sangre Débil',
  () => {
    assert.equal(
      characterDependencyCatalog
        .thinBloodTraits.length,
      16,
    )

    assert.equal(
      new Set(
        characterDependencyCatalog
          .thinBloodTraits.map(
            ({ key }) => key,
          ),
      ).size,
      16,
    )
  },
)
