import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterRulesCatalog,
} from '../dist/characters/domain/character-rules-catalog.js'

import {
  createCharacterDisciplineValidationContributor,
} from '../dist/characters/domain/character-discipline-validation.contributor.js'

function character(overrides = {}) {
  return {
    disciplines: [
      {
        disciplineKey: 'auspex',
        rating: 2,
        powerKeys: [
          'auspex-heightened-senses',
          'auspex-premonition',
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

function validate(
  value = character(),
  context = 'activation',
  catalog = characterRulesCatalog,
) {
  return createCharacterDisciplineValidationContributor(
    catalog,
  ).validate(value, context)[0]
}

function codes(result) {
  return result.issues.map((issue) => issue.code)
}

test(
  '029-R valida Poderes por existencia pertenencia y nivel',
  () => {
    const result = validate(
      character({
        disciplines: [
          {
            disciplineKey: 'auspex',
            rating: 1,
            powerKeys: ['celerity-fleetness'],
            origin: 'creation',
          },
        ],
      }),
    )

    assert.equal(result.state, 'invalid')
    assert.ok(
      codes(result).includes(
        'CHARACTER_DISCIPLINE_POWER_WRONG_DISCIPLINE',
      ),
    )
  },
)

test(
  '029-R rechaza Poderes desconocidos y requisitos incumplidos',
  () => {
    const unknown = validate(
      character({
        disciplines: [
          {
            disciplineKey: 'auspex',
            rating: 1,
            powerKeys: ['unknown-power'],
            origin: 'creation',
          },
        ],
      }),
    )
    const prerequisite = validate(
      character({
        disciplines: [
          {
            disciplineKey: 'obfuscate',
            rating: 4,
            powerKeys: [
              'obfuscate-silence-of-death',
              'obfuscate-unseen-passage',
              'obfuscate-ghost-in-the-machine',
              'obfuscate-vanish',
            ],
            origin: 'creation',
          },
        ],
      }),
    )
    const amalgam = validate(
      character({
        disciplines: [
          {
            disciplineKey: 'celerity',
            rating: 4,
            powerKeys: [
              'celerity-cats-grace',
              'celerity-fleetness',
              'celerity-blink',
              'celerity-unerring-aim',
            ],
            origin: 'creation',
          },
        ],
      }),
    )

    assert.ok(
      codes(unknown).includes(
        'CHARACTER_DISCIPLINE_POWER_UNKNOWN',
      ),
    )
    assert.ok(
      codes(prerequisite).includes(
        'CHARACTER_DISCIPLINE_POWER_PREREQUISITE_MISSING',
      ),
    )
    assert.ok(
      codes(amalgam).includes(
        'CHARACTER_DISCIPLINE_POWER_AMALGAM_UNMET',
      ),
    )
  },
)

test(
  '029-R valida Rituales Ceremonias y Formulas contra el catalogo',
  () => {
    const rituals = validate(
      character({
        disciplines: [
          {
            disciplineKey: 'bloodSorcery',
            rating: 1,
            powerKeys: [
              'blood-sorcery-taste-for-blood',
            ],
            origin: 'creation',
          },
        ],
        bloodSorceryRituals: {
          ritualKeys: ['unknown-ritual'],
        },
      }),
    )
    const ceremonies = validate(
      character({
        disciplines: [
          {
            disciplineKey: 'oblivion',
            rating: 1,
            powerKeys: ['oblivion-shadow-cloak'],
            origin: 'creation',
          },
        ],
        oblivionCeremonies: {
          ceremonyKeys: [
            'oblivion-ceremony-summon-spirit',
          ],
        },
      }),
    )
    const formulas = validate(
      character({
        disciplines: [],
        thinBloodAlchemy: {
          rating: 1,
          method: 'fixatio',
          formulaKeys: ['envelop'],
        },
      }),
    )

    assert.ok(
      codes(rituals).includes(
        'CHARACTER_BLOOD_SORCERY_RITUAL_UNKNOWN',
      ),
    )
    assert.ok(
      codes(ceremonies).includes(
        'CHARACTER_OBLIVION_CEREMONY_PREREQUISITE_MISSING',
      ),
    )
    assert.ok(
      codes(formulas).includes(
        'CHARACTER_THIN_BLOOD_FORMULA_LEVEL_UNMET',
      ),
    )
  },
)

test(
  '029-R diferencia borrador pendiente y activacion incompleta',
  () => {
    const incomplete = character({
      disciplines: [
        {
          disciplineKey: 'auspex',
          rating: 2,
          powerKeys: [
            'auspex-heightened-senses',
          ],
          origin: 'creation',
        },
      ],
    })
    const draft = validate(
      incomplete,
      'draftSave',
    )
    const activation = validate(
      incomplete,
      'activation',
    )

    assert.equal(draft.state, 'pending')
    assert.equal(draft.issues[0].severity, 'warning')
    assert.equal(activation.state, 'invalid')
    assert.equal(
      activation.issues[0].severity,
      'error',
    )
  },
)

test(
  '029-R conserva pending cuando el manifiesto no autoriza el dominio',
  () => {
    const pendingCatalog = {
      manifest: {
        schemaVersion: 1,
        catalogVersion: 'pending-test',
        domains: {
          disciplines: 'pending',
          advantages: 'pending',
          dependencies: 'pending',
        },
      },
      disciplineCatalog:
        characterRulesCatalog.disciplineCatalog,
      stateOf(domain) {
        return this.manifest.domains[domain]
      },
    }
    const result = validate(
      character(),
      'activation',
      pendingCatalog,
    )

    assert.equal(result.state, 'pending')
    assert.deepEqual(codes(result), [
      'CHARACTER_DISCIPLINE_CATALOG_VALIDATION_PENDING',
    ])
  },
)
