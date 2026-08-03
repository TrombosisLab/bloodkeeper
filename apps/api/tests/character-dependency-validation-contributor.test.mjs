import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterDependencyValidationContributor,
} from '../dist/characters/domain/character-dependency-validation.contributor.js'

function character(overrides = {}) {
  return {
    identity: {
      clanKey: 'ventrue',
      predatorTypeKey: 'sandman',
    },
    disciplines: [],
    skillSpecialties: [],
    advantages: { selections: [] },
    thinBloodAlchemy: {
      rating: 0,
      method: null,
      formulaKeys: [],
    },
    thinBloodTraits: [],
    ...overrides,
  }
}

function validate(value = character()) {
  return characterDependencyValidationContributor
    .validate(value, 'activation')[0]
}

function codes(result) {
  return result.issues.map((issue) => issue.code)
}

test(
  '029-O mantiene pendientes solo las dependencias de catalogo',
  () => {
    const result = validate()

    assert.equal(result.section, 'dependencies')
    assert.equal(result.state, 'pending')
    assert.deepEqual(codes(result), [
      'CHARACTER_CATALOG_DEPENDENCY_VALIDATION_PENDING',
    ])
  },
)

test(
  '029-O rechaza efectos depredadores sin Tipo seleccionado',
  () => {
    const result = validate(
      character({
        identity: {
          clanKey: 'ventrue',
          predatorTypeKey: null,
        },
        disciplines: [
          {
            disciplineKey: 'dominate',
            rating: 1,
            powerKeys: ['cloud-memory'],
            origin: 'predatorType',
          },
        ],
        skillSpecialties: [
          {
            id: 'specialty-029-o',
            skillKey: 'stealth',
            name: 'Allanamiento',
            origin: 'predatorType',
          },
        ],
      }),
    )

    assert.ok(
      codes(result).includes(
        'CHARACTER_PREDATOR_TYPE_ORIGIN_WITHOUT_SELECTION',
      ),
    )
  },
)

test(
  '029-O impide datos de Sangre Debil en otros clanes',
  () => {
    const result = validate(
      character({
        advantages: {
          selections: [
            {
              selectionId: 'trait-origin',
              definitionKey: 'day-drinker',
              category: 'merit',
              rating: 2,
              origin: 'thinBlood',
              parentSelectionId: null,
              details: null,
            },
          ],
        },
        thinBloodAlchemy: {
          rating: 1,
          method: 'fixatio',
          formulaKeys: ['far-reach'],
        },
        thinBloodTraits: [
          {
            definitionKey: 'day-drinker',
            clanCurseDetails: null,
            disciplineAffinityDetails: null,
          },
        ],
      }),
    )

    assert.ok(
      codes(result).includes(
        'CHARACTER_THIN_BLOOD_ORIGIN_NOT_ALLOWED',
      ),
    )
    assert.ok(
      codes(result).includes(
        'CHARACTER_THIN_BLOOD_TRAITS_NOT_ALLOWED',
      ),
    )
    assert.ok(
      codes(result).includes(
        'CHARACTER_THIN_BLOOD_ALCHEMY_NOT_ALLOWED',
      ),
    )
  },
)

test(
  '029-O valida unicidad y propiedad de detalles de rasgos',
  () => {
    const result = validate(
      character({
        identity: {
          clanKey: 'thinBlood',
          predatorTypeKey: null,
        },
        thinBloodTraits: [
          {
            definitionKey: 'day-drinker',
            clanCurseDetails: {
              clanKey: 'brujah',
            },
            disciplineAffinityDetails: {
              disciplineKey: 'auspex',
              powerKey: 'heightened-senses',
            },
          },
          {
            definitionKey: 'day-drinker',
            clanCurseDetails: null,
            disciplineAffinityDetails: null,
          },
        ],
      }),
    )

    assert.ok(
      codes(result).includes(
        'CHARACTER_THIN_BLOOD_TRAIT_DUPLICATE',
      ),
    )
    assert.ok(
      codes(result).includes(
        'CHARACTER_THIN_BLOOD_CLAN_CURSE_DETAILS_NOT_ALLOWED',
      ),
    )
    assert.ok(
      codes(result).includes(
        'CHARACTER_THIN_BLOOD_DISCIPLINE_AFFINITY_DETAILS_NOT_ALLOWED',
      ),
    )
  },
)

test(
  '029-O aplica prerrequisitos de Maldicion de Clan persistida',
  () => {
    const bestial = validate(
      character({
        identity: {
          clanKey: 'thinBlood',
          predatorTypeKey: null,
        },
        thinBloodTraits: [
          {
            definitionKey: 'clan-curse',
            clanCurseDetails: {
              clanKey: 'brujah',
            },
            disciplineAffinityDetails: null,
          },
        ],
      }),
    )
    const bonding = validate(
      character({
        identity: {
          clanKey: 'thinBlood',
          predatorTypeKey: null,
        },
        thinBloodTraits: [
          {
            definitionKey: 'clan-curse',
            clanCurseDetails: {
              clanKey: 'tremere',
            },
            disciplineAffinityDetails: null,
          },
        ],
      }),
    )

    assert.ok(
      codes(bestial).includes(
        'CHARACTER_THIN_BLOOD_BESTIAL_TEMPER_REQUIRED',
      ),
    )
    assert.ok(
      codes(bonding).includes(
        'CHARACTER_THIN_BLOOD_BONDING_BLOOD_REQUIRED',
      ),
    )
  },
)

test(
  '029-O acepta detalles estructurales completos de Sangre Debil',
  () => {
    const result = validate(
      character({
        identity: {
          clanKey: 'thinBlood',
          predatorTypeKey: null,
        },
        thinBloodTraits: [
          {
            definitionKey: 'discipline-affinity',
            clanCurseDetails: null,
            disciplineAffinityDetails: {
              disciplineKey: 'auspex',
              powerKey: 'heightened-senses',
            },
          },
          {
            definitionKey: 'clan-curse',
            clanCurseDetails: {
              clanKey: 'brujah',
            },
            disciplineAffinityDetails: null,
          },
          {
            definitionKey: 'bestial-temper',
            clanCurseDetails: null,
            disciplineAffinityDetails: null,
          },
        ],
      }),
    )

    assert.equal(result.state, 'pending')
    assert.deepEqual(codes(result), [
      'CHARACTER_CATALOG_DEPENDENCY_VALIDATION_PENDING',
    ])
  },
)
