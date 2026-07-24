import assert from 'node:assert/strict'
import test from 'node:test'

import {
  validateThinBloodClanCurseDetails,
  validateThinBloodTraitSelection,
} from '../src/features/character-creation/domain/thin-blood-trait-rules.ts'

function draft(...selections) {
  return {
    selections,
  }
}

test(
  'Maldición de Clan acepta una Prohibición de uno de los 13 clanes',
  () => {
    const result =
      validateThinBloodClanCurseDetails(
        draft({
          definitionKey: 'clan-curse',
          clanCurseDetails: {
            clanKey: 'brujah',
          },
        }),
      )

    assert.equal(result.valid, true)
    assert.deepEqual(result.errors, [])
  },
)

test(
  'Maldición de Clan exige indicar una Prohibición de Clan',
  () => {
    const result =
      validateThinBloodClanCurseDetails(
        draft({
          definitionKey: 'clan-curse',
        }),
      )

    assert.equal(result.valid, false)

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'requiere seleccionar',
          ),
      ),
      true,
    )
  },
)

test(
  'Maldición de Clan rechaza Caitiff como Prohibición seleccionable',
  () => {
    const result =
      validateThinBloodClanCurseDetails(
        draft({
          definitionKey: 'clan-curse',
          clanCurseDetails: {
            clanKey: 'caitiff',
          },
        }),
      )

    assert.equal(result.valid, false)
  },
)

test(
  'Maldición de Clan rechaza Sangre Débil como Prohibición seleccionable',
  () => {
    const result =
      validateThinBloodClanCurseDetails(
        draft({
          definitionKey: 'clan-curse',
          clanCurseDetails: {
            clanKey: 'thinBlood',
          },
        }),
      )

    assert.equal(result.valid, false)
  },
)

test(
  'un rasgo distinto de Maldición de Clan no puede contener clanCurseDetails',
  () => {
    const result =
      validateThinBloodClanCurseDetails(
        draft({
          definitionKey: 'day-drinker',
          clanCurseDetails: {
            clanKey: 'brujah',
          },
        }),
      )

    assert.equal(result.valid, false)
  },
)

test(
  'la validación completa exige los detalles de Maldición de Clan',
  () => {
    const invalid =
      validateThinBloodTraitSelection(
        draft(
          {
            definitionKey: 'day-drinker',
          },
          {
            definitionKey: 'clan-curse',
          },
        ),
      )

    assert.equal(invalid.valid, false)

    const valid =
      validateThinBloodTraitSelection(
        draft(
          {
            definitionKey: 'day-drinker',
          },
          {
            definitionKey: 'clan-curse',
            clanCurseDetails: {
              clanKey: 'ventrue',
            },
          },
        ),
      )

    assert.equal(valid.valid, true)
  },
)

test(
  'los rasgos anteriores conservan el contrato mínimo definitionKey',
  () => {
    const result =
      validateThinBloodTraitSelection(
        draft(
          {
            definitionKey: 'day-drinker',
          },
          {
            definitionKey: 'baby-teeth',
          },
        ),
      )

    assert.equal(result.valid, true)
    assert.deepEqual(result.errors, [])
  },
)
