import assert from 'node:assert/strict'
import test from 'node:test'

import {
  isCharacterBlushOfLifeRouseExemption,
  isSameCharacterBlushOfLifeExemptionOperation,
} from '../dist/characters/domain/character-blush-of-life.types.js'

test(
  '059-D1A reconoce la exención estructurada de Rubor',
  () => {
    assert.equal(
      isCharacterBlushOfLifeRouseExemption(
        'enthusiasticAboutLife',
      ),
      true,
    )

    assert.equal(
      isCharacterBlushOfLifeRouseExemption(
        'excited',
      ),
      false,
    )
  },
)

test(
  '059-D1A idempotencia exenta compara actor y no revisión',
  () => {
    const existing = {
      actorId: 'actor-1',
    }

    assert.equal(
      isSameCharacterBlushOfLifeExemptionOperation(
        existing,
        {
          actorId: 'actor-1',
        },
      ),
      true,
    )

    assert.equal(
      isSameCharacterBlushOfLifeExemptionOperation(
        existing,
        {
          actorId: 'actor-2',
        },
      ),
      false,
    )
  },
)
