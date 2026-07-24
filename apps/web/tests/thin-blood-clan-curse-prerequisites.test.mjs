import assert from 'node:assert/strict'
import test from 'node:test'

import {
  validateThinBloodClanCursePrerequisites,
  validateThinBloodTraitSelection,
} from '../src/features/character-creation/domain/thin-blood-trait-rules.ts'

function draft(...selections) {
  return {
    selections,
  }
}

function clanCurse(clanKey) {
  return {
    definitionKey: 'clan-curse',
    clanCurseDetails: {
      clanKey,
    },
  }
}

test(
  'Maldición Brujah requiere Temperamento Bestial',
  () => {
    const invalid =
      validateThinBloodClanCursePrerequisites(
        draft(
          clanCurse('brujah'),
        ),
      )

    assert.equal(invalid.valid, false)

    const valid =
      validateThinBloodClanCursePrerequisites(
        draft(
          clanCurse('brujah'),
          {
            definitionKey:
              'bestial-temper',
          },
        ),
      )

    assert.equal(valid.valid, true)
    assert.deepEqual(valid.errors, [])
  },
)

test(
  'Maldición Gangrel requiere Temperamento Bestial',
  () => {
    const invalid =
      validateThinBloodClanCursePrerequisites(
        draft(
          clanCurse('gangrel'),
        ),
      )

    assert.equal(invalid.valid, false)

    const valid =
      validateThinBloodClanCursePrerequisites(
        draft(
          clanCurse('gangrel'),
          {
            definitionKey:
              'bestial-temper',
          },
        ),
      )

    assert.equal(valid.valid, true)
  },
)

test(
  'Maldición Tremere requiere Sangre Vinculante',
  () => {
    const invalid =
      validateThinBloodClanCursePrerequisites(
        draft(
          clanCurse('tremere'),
        ),
      )

    assert.equal(invalid.valid, false)

    const valid =
      validateThinBloodClanCursePrerequisites(
        draft(
          clanCurse('tremere'),
          {
            definitionKey:
              'bonding-blood',
          },
        ),
      )

    assert.equal(valid.valid, true)
  },
)

test(
  'Temperamento Bestial no satisface el requisito Tremere',
  () => {
    const result =
      validateThinBloodClanCursePrerequisites(
        draft(
          clanCurse('tremere'),
          {
            definitionKey:
              'bestial-temper',
          },
        ),
      )

    assert.equal(result.valid, false)
  },
)

test(
  'Sangre Vinculante no sustituye Temperamento Bestial para Brujah',
  () => {
    const result =
      validateThinBloodClanCursePrerequisites(
        draft(
          clanCurse('brujah'),
          {
            definitionKey:
              'bonding-blood',
          },
        ),
      )

    assert.equal(result.valid, false)
  },
)

test(
  'un clan sin prerrequisito especial no recibe restricciones inventadas',
  () => {
    const result =
      validateThinBloodClanCursePrerequisites(
        draft(
          clanCurse('ventrue'),
        ),
      )

    assert.equal(result.valid, true)
    assert.deepEqual(result.errors, [])
  },
)

test(
  'la validación completa rechaza Maldición Brujah sin Temperamento Bestial',
  () => {
    const result =
      validateThinBloodTraitSelection(
        draft(
          clanCurse('brujah'),
          {
            definitionKey:
              'day-drinker',
          },
        ),
      )

    assert.equal(result.valid, false)

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'Temperamento Bestial',
          ),
      ),
      true,
    )
  },
)

test(
  'la validación completa acepta Maldición Brujah con Temperamento Bestial y selección equilibrada',
  () => {
    const result =
      validateThinBloodTraitSelection(
        draft(
          clanCurse('brujah'),
          {
            definitionKey:
              'bestial-temper',
          },
          {
            definitionKey:
              'day-drinker',
          },
          {
            definitionKey:
              'camarilla-contact',
          },
        ),
      )

    assert.equal(result.valid, true)
    assert.deepEqual(result.errors, [])
  },
)

test(
  'la validación completa acepta Maldición Tremere con Sangre Vinculante',
  () => {
    const result =
      validateThinBloodTraitSelection(
        draft(
          clanCurse('tremere'),
          {
            definitionKey:
              'bonding-blood',
          },
        ),
      )

    assert.equal(result.valid, true)
    assert.deepEqual(result.errors, [])
  },
)

test(
  'la validación completa mantiene válida una Maldición sin prerrequisito especial',
  () => {
    const result =
      validateThinBloodTraitSelection(
        draft(
          clanCurse('ventrue'),
          {
            definitionKey:
              'day-drinker',
          },
        ),
      )

    assert.equal(result.valid, true)
    assert.deepEqual(result.errors, [])
  },
)
