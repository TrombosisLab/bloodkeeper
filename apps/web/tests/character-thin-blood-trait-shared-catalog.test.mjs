import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterDependencyCatalog,
} from '@v5r/character-rules'

import {
  thinBloodTraitDefinitions,
} from '../src/features/character-creation/data/thin-blood-trait-definitions.ts'

test(
  '057-E3C1 Web consume el catálogo compartido de rasgos Sangre Débil',
  () => {
    assert.deepEqual(
      thinBloodTraitDefinitions,
      characterDependencyCatalog
        .thinBloodTraits,
    )
  },
)
