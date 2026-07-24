import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getThinBloodClanCurseSeverity,
} from '../src/features/character-creation/domain/thin-blood-trait-rules.ts'

test(
  'Maldición de Clan de Sangre Débil tiene Severidad efectiva 1',
  () => {
    assert.equal(
      getThinBloodClanCurseSeverity(),
      1,
    )
  },
)

test(
  'la Severidad de Maldición de Clan es una regla derivada sin parámetros configurables',
  () => {
    assert.equal(
      getThinBloodClanCurseSeverity.length,
      0,
    )

    assert.equal(
      getThinBloodClanCurseSeverity(),
      1,
    )
  },
)
