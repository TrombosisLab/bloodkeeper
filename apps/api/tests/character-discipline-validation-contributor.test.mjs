import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterDisciplineValidationContributor,
} from '../dist/characters/domain/character-discipline-validation.contributor.js'

function character(overrides = {}) {
  return {
    disciplines: [
      {
        disciplineKey: 'auspex',
        rating: 2,
        powerKeys: [
          'heightened-senses',
          'premonition',
        ],
        origin: 'creation',
      },
    ],
    bloodSorceryRituals: { ritualKeys: [] },
    oblivionCeremonies: { ceremonyKeys: [] },
    thinBloodAlchemy: {
      rating: 0,
      method: null,
      formulaKeys: [],
    },
    ...overrides,
  }
}

function validate(value = character()) {
  return characterDisciplineValidationContributor
    .validate(value, 'activation')[0]
}

function codes(result) {
  return result.issues.map((issue) => issue.code)
}

test(
  '029-M valida estructura sin declarar completo el catalogo',
  () => {
    const result = validate()

    assert.equal(result.section, 'disciplines')
    assert.equal(result.state, 'pending')
    assert.deepEqual(codes(result), [
      'CHARACTER_DISCIPLINE_CATALOG_VALIDATION_PENDING',
    ])
    assert.equal(result.issues[0].severity, 'warning')
  },
)

test(
  '029-M rechaza disciplinas duplicadas o fuera de rango',
  () => {
    const result = validate(
      character({
        disciplines: [
          {
            disciplineKey: 'auspex',
            rating: 0,
            powerKeys: [],
            origin: 'creation',
          },
          {
            disciplineKey: 'auspex',
            rating: 6,
            powerKeys: [],
            origin: 'predatorType',
          },
        ],
      }),
    )

    assert.equal(result.state, 'invalid')
    assert.ok(
      codes(result).includes(
        'CHARACTER_DISCIPLINE_DUPLICATE',
      ),
    )
    assert.equal(
      codes(result).filter(
        (code) =>
          code ===
          'CHARACTER_DISCIPLINE_RATING_OUT_OF_RANGE',
      ).length,
      2,
    )
  },
)

test(
  '029-M rechaza Poderes vacios duplicados o sobre capacidad',
  () => {
    const result = validate(
      character({
        disciplines: [
          {
            disciplineKey: 'auspex',
            rating: 1,
            powerKeys: ['', 'premonition'],
            origin: 'creation',
          },
          {
            disciplineKey: 'celerity',
            rating: 1,
            powerKeys: ['premonition'],
            origin: 'creation',
          },
        ],
      }),
    )

    assert.equal(result.state, 'invalid')
    assert.ok(
      codes(result).includes(
        'CHARACTER_DISCIPLINE_POWER_KEY_REQUIRED',
      ),
    )
    assert.ok(
      codes(result).includes(
        'CHARACTER_DISCIPLINE_POWER_DUPLICATE',
      ),
    )
    assert.ok(
      codes(result).includes(
        'CHARACTER_DISCIPLINE_POWER_CAPACITY_EXCEEDED',
      ),
    )
  },
)

test(
  '029-M exige las Disciplinas base de Rituales y Ceremonias',
  () => {
    const result = validate(
      character({
        bloodSorceryRituals: {
          ritualKeys: ['blood-walk'],
        },
        oblivionCeremonies: {
          ceremonyKeys: ['summon-spirit'],
        },
      }),
    )

    assert.equal(result.state, 'invalid')
    assert.ok(
      codes(result).includes(
        'CHARACTER_BLOOD_SORCERY_REQUIRED_FOR_RITUALS',
      ),
    )
    assert.ok(
      codes(result).includes(
        'CHARACTER_OBLIVION_REQUIRED_FOR_CEREMONIES',
      ),
    )
  },
)

test(
  '029-M valida coherencia y duplicados de adquisiciones relacionadas',
  () => {
    const result = validate(
      character({
        disciplines: [
          {
            disciplineKey: 'bloodSorcery',
            rating: 1,
            powerKeys: ['corrosive-vitae'],
            origin: 'creation',
          },
          {
            disciplineKey: 'oblivion',
            rating: 1,
            powerKeys: ['shadow-cloak'],
            origin: 'creation',
          },
        ],
        bloodSorceryRituals: {
          ritualKeys: ['blood-walk', 'blood-walk'],
        },
        oblivionCeremonies: {
          ceremonyKeys: [
            'summon-spirit',
            'summon-spirit',
          ],
        },
        thinBloodAlchemy: {
          rating: 2,
          method: null,
          formulaKeys: ['far-reach', 'far-reach'],
        },
      }),
    )

    assert.equal(result.state, 'invalid')
    assert.ok(
      codes(result).includes(
        'CHARACTER_BLOOD_SORCERY_RITUAL_DUPLICATE',
      ),
    )
    assert.ok(
      codes(result).includes(
        'CHARACTER_OBLIVION_CEREMONY_DUPLICATE',
      ),
    )
    assert.ok(
      codes(result).includes(
        'CHARACTER_THIN_BLOOD_FORMULA_DUPLICATE',
      ),
    )
    assert.ok(
      codes(result).includes(
        'CHARACTER_THIN_BLOOD_ALCHEMY_METHOD_REQUIRED',
      ),
    )
  },
)

test(
  '029-M rechaza Alquimia sin puntuacion y puntuaciones imposibles',
  () => {
    const withoutRating = validate(
      character({
        thinBloodAlchemy: {
          rating: 0,
          method: 'fixatio',
          formulaKeys: ['far-reach'],
        },
      }),
    )
    const outOfRange = validate(
      character({
        thinBloodAlchemy: {
          rating: 6,
          method: 'fixatio',
          formulaKeys: [],
        },
      }),
    )

    assert.ok(
      codes(withoutRating).includes(
        'CHARACTER_THIN_BLOOD_ALCHEMY_WITHOUT_RATING',
      ),
    )
    assert.ok(
      codes(outOfRange).includes(
        'CHARACTER_THIN_BLOOD_ALCHEMY_RATING_OUT_OF_RANGE',
      ),
    )
  },
)
