import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createEmptyThinBloodAlchemy,
  hasThinBloodAlchemistMerit,
  normalizeThinBloodAlchemyForCharacter,
  validateThinBloodAlchemyForCharacter,
} from '../src/features/character-creation/domain/thin-blood-alchemy-rules.ts'

function traits(...definitionKeys) {
  return {
    selections:
      definitionKeys.map(
        (definitionKey) => ({
          definitionKey,
        }),
      ),
  }
}

function alchemy(overrides = {}) {
  return {
    rating: 1,
    method: 'fixatio',
    formulaKeys: [
      'farReach',
    ],
    ...overrides,
  }
}

test(
  'detecta el Mérito Alquimista de Sangre Débil por su key canónica',
  () => {
    assert.equal(
      hasThinBloodAlchemistMerit(
        traits(
          'thin-blood-alchemist',
        ),
      ),
      true,
    )

    assert.equal(
      hasThinBloodAlchemistMerit(
        traits(
          'day-drinker',
        ),
      ),
      false,
    )
  },
)

test(
  'Sangre Débil sin Alquimista no puede conservar Alquimia',
  () => {
    const normalized =
      normalizeThinBloodAlchemyForCharacter(
        alchemy(),
        'thinBlood',
        traits(
          'day-drinker',
        ),
      )

    assert.deepEqual(
      normalized,
      createEmptyThinBloodAlchemy(),
    )
  },
)

test(
  'Sangre Débil con Alquimista puede conservar Alquimia válida',
  () => {
    const value =
      alchemy()

    const normalized =
      normalizeThinBloodAlchemyForCharacter(
        value,
        'thinBlood',
        traits(
          'thin-blood-alchemist',
        ),
      )

    assert.deepEqual(
      normalized,
      value,
    )
  },
)

test(
  'un personaje no Sangre Débil no conserva Alquimia aunque inyecte el Mérito',
  () => {
    const normalized =
      normalizeThinBloodAlchemyForCharacter(
        alchemy(),
        'brujah',
        traits(
          'thin-blood-alchemist',
        ),
      )

    assert.deepEqual(
      normalized,
      createEmptyThinBloodAlchemy(),
    )
  },
)

test(
  'la validación acepta estado vacío en Sangre Débil sin Alquimista',
  () => {
    const result =
      validateThinBloodAlchemyForCharacter(
        createEmptyThinBloodAlchemy(),
        'thinBlood',
        traits(
          'day-drinker',
        ),
      )

    assert.equal(
      result.valid,
      true,
    )

    assert.deepEqual(
      result.errors,
      [],
    )
  },
)

test(
  'la validación rechaza Alquimia positiva sin el Mérito Alquimista',
  () => {
    const result =
      validateThinBloodAlchemyForCharacter(
        alchemy(),
        'thinBlood',
        traits(
          'day-drinker',
        ),
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'Alquimista de Sangre Débil',
          ),
      ),
      true,
    )
  },
)

test(
  'la validación acepta Alquimia válida con el Mérito Alquimista',
  () => {
    const result =
      validateThinBloodAlchemyForCharacter(
        alchemy(),
        'thinBlood',
        traits(
          'thin-blood-alchemist',
        ),
      )

    assert.equal(
      result.valid,
      true,
    )

    assert.deepEqual(
      result.errors,
      [],
    )
  },
)

test(
  'la validación mantiene las reglas internas de Alquimia cuando el Mérito está presente',
  () => {
    const result =
      validateThinBloodAlchemyForCharacter(
        alchemy({
          method: null,
        }),
        'thinBlood',
        traits(
          'thin-blood-alchemist',
        ),
      )

    assert.equal(
      result.valid,
      false,
    )

    assert.equal(
      result.errors.some(
        (error) =>
          error.includes(
            'método de destilación',
          ),
      ),
      true,
    )
  },
)

test(
  'quitar el Mérito hace que la normalización limpie un estado de Alquimia previo',
  () => {
    const withMerit =
      normalizeThinBloodAlchemyForCharacter(
        alchemy(),
        'thinBlood',
        traits(
          'thin-blood-alchemist',
        ),
      )

    assert.equal(
      withMerit.rating,
      1,
    )

    const withoutMerit =
      normalizeThinBloodAlchemyForCharacter(
        withMerit,
        'thinBlood',
        traits(
          'day-drinker',
        ),
      )

    assert.deepEqual(
      withoutMerit,
      createEmptyThinBloodAlchemy(),
    )
  },
)

test(
  'el gating no modifica el contrato ni el subsistema de fórmulas existente',
  () => {
    const value =
      alchemy({
        formulaKeys: [
          'farReach',
          'haze',
        ],
      })

    const normalized =
      normalizeThinBloodAlchemyForCharacter(
        value,
        'thinBlood',
        traits(
          'thin-blood-alchemist',
        ),
      )

    assert.deepEqual(
      normalized.formulaKeys,
      [
        'farReach',
        'haze',
      ],
    )
  },
)
