import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import {
  characterDependencyValidationContributor,
  createCharacterDependencyValidationContributor,
} from '../dist/characters/domain/character-dependency-validation.contributor.js'

import {
  createCharacterRulesCatalog,
} from '../dist/characters/domain/character-rules-catalog.js'

function advantage(
  selectionId,
  definitionKey,
  category,
  rating,
) {
  return {
    selectionId,
    definitionKey,
    category,
    rating,
    origin: 'predatorType',
    parentSelectionId: null,
    details: null,
  }
}

function discipline(disciplineKey, rating = 1) {
  return {
    disciplineKey,
    rating,
    powerKeys: [],
    origin: 'predatorType',
  }
}

function specialty(id, skillKey, name) {
  return {
    id,
    skillKey,
    name,
    origin: 'predatorType',
  }
}

function character(overrides = {}) {
  return {
    identity: {
      clanKey: 'ventrue',
      predatorTypeKey: 'sandman',
      generation: 13,
    },
    blood: {
      bloodPotency: 1,
    },
    humanity: {
      value: 7,
    },
    disciplines: [
      discipline('obfuscate'),
    ],
    skillSpecialties: [
      specialty(
        'predatorType:sandman:specialty:medicine',
        'medicine',
        'Anestesia',
      ),
    ],
    advantages: {
      selections: [
        advantage(
          'predatorType:sandman:resources',
          'resources',
          'background',
          1,
        ),
      ],
    },
    thinBloodAlchemy: {
      rating: 0,
      method: null,
      formulaKeys: [],
    },
    thinBloodTraits: [],
    ...overrides,
  }
}

function validate(
  value = character(),
  context = 'activation',
  contributor = characterDependencyValidationContributor,
) {
  return contributor.validate(value, context)[0]
}

function codes(result) {
  return result.issues.map((issue) => issue.code)
}

test(
  '029-T completa dependencias cuando los efectos coinciden con el Tipo',
  () => {
    const result = validate()

    assert.equal(result.section, 'dependencies')
    assert.equal(result.state, 'complete')
    assert.deepEqual(result.issues, [])
  },
)

test(
  '029-T diferencia borrador incompleto y activacion incompleta',
  () => {
    const value = character({
      disciplines: [],
      skillSpecialties: [],
      advantages: { selections: [] },
    })
    const draft = validate(value, 'draftSave')
    const activation = validate(value, 'activation')

    assert.equal(draft.state, 'pending')
    assert.ok(
      draft.issues.every(
        (candidate) => candidate.severity === 'warning',
      ),
    )
    assert.equal(activation.state, 'invalid')
    assert.ok(
      codes(activation).includes(
        'CHARACTER_PREDATOR_TYPE_FIXED_ADVANTAGE_MISSING',
      ),
    )
    assert.ok(
      codes(activation).includes(
        'CHARACTER_PREDATOR_TYPE_CHOICE_MISSING',
      ),
    )
  },
)

test(
  '029-T rechaza Tipo desconocido y efectos ajenos',
  () => {
    const unknown = validate(
      character({
        identity: {
          clanKey: 'ventrue',
          predatorTypeKey: 'unknown',
          generation: 13,
        },
      }),
    )
    const unexpected = validate(
      character({
        disciplines: [
          discipline('potence'),
        ],
      }),
    )

    assert.ok(
      codes(unknown).includes(
        'CHARACTER_PREDATOR_TYPE_UNKNOWN',
      ),
    )
    assert.ok(
      codes(unexpected).includes(
        'CHARACTER_PREDATOR_TYPE_DISCIPLINE_UNEXPECTED',
      ),
    )
  },
)

test(
  '029-T aplica restricciones de clan y Potencia de Sangre',
  () => {
    const result = validate(
      character({
        identity: {
          clanKey: 'ventrue',
          predatorTypeKey: 'farmer',
          generation: 13,
        },
        blood: {
          bloodPotency: 3,
        },
        humanity: {
          value: 8,
        },
        disciplines: [
          discipline('animalism'),
        ],
        skillSpecialties: [
          specialty(
            'farmer-specialty',
            'animalKen',
            'Animal específico',
          ),
        ],
        advantages: {
          selections: [
            advantage(
              'farmer-vegan',
              'vegan',
              'flaw',
              2,
            ),
          ],
        },
      }),
    )

    assert.ok(
      codes(result).includes(
        'CHARACTER_PREDATOR_TYPE_CLAN_EXCLUDED',
      ),
    )
    assert.ok(
      codes(result).includes(
        'CHARACTER_PREDATOR_TYPE_BLOOD_POTENCY_TOO_HIGH',
      ),
    )
  },
)

test(
  '029-T une modificadores de Humanidad y Potencia de Sangre',
  () => {
    const valid = validate(
      character({
        identity: {
          clanKey: 'brujah',
          predatorTypeKey: 'blood-leech',
          generation: 13,
        },
        blood: {
          bloodPotency: 2,
        },
        humanity: {
          value: 6,
        },
        disciplines: [
          discipline('celerity'),
        ],
        skillSpecialties: [
          specialty(
            'blood-leech-specialty',
            'brawl',
            'Vástagos',
          ),
        ],
        advantages: {
          selections: [
            advantage(
              'blood-leech-prey',
              'prey-exclusion',
              'flaw',
              2,
            ),
            advantage(
              'blood-leech-social',
              'shunned',
              'flaw',
              2,
            ),
          ],
        },
      }),
    )
    const invalid = validate(
      character({
        identity: {
          clanKey: 'brujah',
          predatorTypeKey: 'blood-leech',
          generation: 13,
        },
        blood: {
          bloodPotency: 1,
        },
        humanity: {
          value: 7,
        },
        disciplines: [
          discipline('celerity'),
        ],
        skillSpecialties: [
          specialty(
            'blood-leech-specialty',
            'brawl',
            'Vástagos',
          ),
        ],
        advantages: {
          selections: [
            advantage(
              'blood-leech-prey',
              'prey-exclusion',
              'flaw',
              2,
            ),
            advantage(
              'blood-leech-social',
              'shunned',
              'flaw',
              2,
            ),
          ],
        },
      }),
    )

    assert.equal(valid.state, 'complete')
    assert.ok(
      codes(invalid).includes(
        'CHARACTER_PREDATOR_TYPE_HUMANITY_MODIFIER_MISSING',
      ),
    )
    assert.ok(
      codes(invalid).includes(
        'CHARACTER_PREDATOR_TYPE_BLOOD_POTENCY_MODIFIER_MISSING',
      ),
    )
  },
)

test(
  '029-T valida los dos repartos de puntos de Osiris',
  () => {
    const valid = validate(
      character({
        identity: {
          clanKey: 'brujah',
          predatorTypeKey: 'osiris',
          generation: 13,
        },
        disciplines: [
          discipline('presence'),
        ],
        skillSpecialties: [
          specialty(
            'osiris-specialty',
            'occult',
            'Tradición específica',
          ),
        ],
        advantages: {
          selections: [
            advantage(
              'osiris-fame',
              'fame',
              'background',
              3,
            ),
            advantage(
              'osiris-enemy',
              'enemy',
              'flaw',
              2,
            ),
          ],
        },
      }),
    )
    const incomplete = validate(
      character({
        identity: {
          clanKey: 'brujah',
          predatorTypeKey: 'osiris',
          generation: 13,
        },
        disciplines: [
          discipline('presence'),
        ],
        skillSpecialties: [
          specialty(
            'osiris-specialty',
            'occult',
            'Tradición específica',
          ),
        ],
        advantages: {
          selections: [
            advantage(
              'osiris-fame',
              'fame',
              'background',
              3,
            ),
          ],
        },
      }),
    )

    assert.equal(valid.state, 'complete')
    assert.ok(
      codes(incomplete).includes(
        'CHARACTER_PREDATOR_TYPE_POINT_DISTRIBUTION_INCOMPLETE',
      ),
    )
  },
)

test(
  '029-T conserva Humanidad inicial 7 sin modificador depredador',
  () => {
    const result = validate(
      character({
        identity: {
          clanKey: 'ventrue',
          predatorTypeKey: null,
          generation: 13,
        },
        humanity: {
          value: 8,
        },
        disciplines: [],
        skillSpecialties: [],
        advantages: { selections: [] },
      }),
    )

    assert.ok(
      codes(result).includes(
        'INITIAL_HUMANITY_VALUE_INVALID',
      ),
    )
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
          generation: 13,
        },
        disciplines: [
          discipline('dominate'),
        ],
        skillSpecialties: [
          specialty(
            'specialty-029-o',
            'stealth',
            'Allanamiento',
          ),
        ],
        advantages: { selections: [] },
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
        identity: {
          clanKey: 'ventrue',
          predatorTypeKey: null,
          generation: 13,
        },
        disciplines: [],
        skillSpecialties: [],
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
          generation: 14,
        },
        disciplines: [],
        skillSpecialties: [],
        advantages: { selections: [] },
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
          generation: 14,
        },
        disciplines: [],
        skillSpecialties: [],
        advantages: { selections: [] },
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
          generation: 14,
        },
        disciplines: [],
        skillSpecialties: [],
        advantages: { selections: [] },
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
          generation: 14,
        },
        disciplines: [],
        skillSpecialties: [],
        advantages: { selections: [] },
        thinBloodTraits: [
          {
            definitionKey: 'discipline-affinity',
            clanCurseDetails: null,
            disciplineAffinityDetails: {
              disciplineKey: 'auspex',
              powerKey: 'auspex-heightened-senses',
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
          {
            definitionKey: 'day-drinker',
            clanCurseDetails: null,
            disciplineAffinityDetails: null,
          },
        ],
      }),
    )

    assert.equal(result.state, 'complete')
    assert.deepEqual(result.issues, [])
  },
)

test(
  '029-T conserva pending cuando el manifiesto no autoriza Dependencias',
  () => {
    const catalog = createCharacterRulesCatalog({
      schemaVersion: 1,
      catalogVersion: 'pending-test',
      domains: {
        disciplines: 'ready',
        advantages: 'ready',
        dependencies: 'pending',
      },
    })
    const contributor =
      createCharacterDependencyValidationContributor(
        catalog,
      )
    const result = validate(
      character(),
      'activation',
      contributor,
    )

    assert.equal(result.state, 'pending')
    assert.deepEqual(codes(result), [
      'CHARACTER_CATALOG_DEPENDENCY_VALIDATION_PENDING',
    ])
  },
)


test(
  'SPEC-021 Sangre Débil no admite Tipo de Depredador',
  () => {
    const result = validate(
      character({
        identity: {
          clanKey: 'thinBlood',
          predatorTypeKey: 'sandman',
          generation: 14,
        },
        blood: {
          bloodPotency: 0,
        },
        disciplines: [],
        skillSpecialties: [],
        advantages: {
          selections: [],
        },
      }),
    )

    assert.equal(result.state, 'invalid')
    assert.ok(
      codes(result).includes(
        'CHARACTER_PREDATOR_TYPE_THIN_BLOOD_FORBIDDEN',
      ),
    )
  },
)


test(
  'SPEC-021 backend mantiene disponibles las opciones generales compatibles',
  async () => {
    const source =
      await readFile(
        new URL(
          '../src/characters/domain/character-dependency-validation.contributor.ts',
          import.meta.url,
        ),
        'utf8',
      )

    assert.doesNotMatch(
      source,
      /const unconditional = choice\.options\.filter/,
    )

    assert.match(
      source,
      /choice\.options[\s\S]*optionConditionMatches[\s\S]*option\.grant/,
    )
  },
)
