import assert from 'node:assert/strict'
import test from 'node:test'

import {
  initialCharacterDraft,
} from '../src/features/character-creation/data/initial-character-draft.ts'

import {
  normalizeCharacterDraftPredatorType,
} from '../src/features/character-creation/domain/predator-type-draft-rules.ts'

function draft(predatorType, bloodPotency = 1) {
  return {
    ...structuredClone(initialCharacterDraft),
    identity: {
      ...structuredClone(initialCharacterDraft.identity),
      clan: 'brujah',
      generation: 13,
      predatorType,
    },
    blood: {
      ...structuredClone(initialCharacterDraft.blood),
      bloodPotency,
    },
  }
}

test(
  '029-T aplica de forma idempotente los modificadores de Blood Leech',
  () => {
    const once =
      normalizeCharacterDraftPredatorType(
        draft('blood-leech'),
      )
    const twice =
      normalizeCharacterDraftPredatorType(once)

    assert.equal(once.humanity.value, 6)
    assert.equal(once.blood.bloodPotency, 2)
    assert.equal(twice.humanity.value, 6)
    assert.equal(twice.blood.bloodPotency, 2)
  },
)

test(
  '029-T aplica Humanidad de Consensualista y Gato Callejero',
  () => {
    assert.equal(
      normalizeCharacterDraftPredatorType(
        draft('consensualist'),
      ).humanity.value,
      8,
    )
    assert.equal(
      normalizeCharacterDraftPredatorType(
        draft('alleycat'),
      ).humanity.value,
      6,
    )
  },
)

test(
  '029-T restablece Humanidad base sin Tipo de Depredador',
  () => {
    const value = draft('', 2)
    value.humanity.value = 6

    const normalized =
      normalizeCharacterDraftPredatorType(value)

    assert.equal(normalized.humanity.value, 7)
    assert.equal(normalized.blood.bloodPotency, 2)
  },
)
