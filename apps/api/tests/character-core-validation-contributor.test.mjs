import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterCoreValidationContributor,
} from '../dist/characters/domain/character-core-validation.contributor.js'

import {
  CharacterValidator,
} from '../dist/characters/domain/character-validator.js'

import {
  CHARACTER_SKILL_KEYS,
} from '../dist/characters/domain/persisted-character.types.js'

function balancedSkills() {
  const ratings = [
    ...Array(7).fill(1),
    ...Array(5).fill(2),
    ...Array(3).fill(3),
  ]

  return Object.fromEntries(
    CHARACTER_SKILL_KEYS.map(
      (key, index) => [key, ratings[index] ?? 0],
    ),
  )
}

function validCharacter() {
  const touchstoneId =
    '4f3c19eb-e667-43a3-b94b-31b2b5adb742'

  return {
    characterId:
      '39c1801e-68fe-4c92-8795-723cac284bdf',
    ownerId:
      '3bbc46f8-a45f-4589-9872-129e6652082c',
    chronicleId: null,
    status: 'draft',
    revision: 1,
    createdAt: new Date('2026-08-03T10:00:00Z'),
    updatedAt: new Date('2026-08-03T10:00:00Z'),
    identity: {
      name: 'Alicia',
      concept: 'Investigadora nocturna',
      predatorTypeKey: 'bagger',
      ambition: null,
      clanKey: 'brujah',
      sire: null,
      desire: null,
      generation: 13,
    },
    creation: {
      schemaVersion: 1,
      currentStep: 'review',
      skillDistributionMethod: 'balanced',
      updatedAt: new Date(
        '2026-08-03T10:00:00Z',
      ),
    },
    attributes: {
      strength: 4,
      dexterity: 3,
      stamina: 3,
      charisma: 3,
      manipulation: 2,
      composure: 2,
      intelligence: 2,
      wits: 2,
      resolve: 1,
    },
    blood: {
      bloodPotency: 1,
      hunger: 1,
    },
    damage: {
      health: {
        superficial: 0,
        aggravated: 0,
      },
      willpower: {
        superficial: 0,
        aggravated: 0,
      },
    },
    skills: balancedSkills(),
    skillSpecialties: [],
    disciplines: [],
    bloodSorceryRituals: { ritualKeys: [] },
    oblivionCeremonies: { ceremonyKeys: [] },
    thinBloodAlchemy: {
      rating: 0,
      method: null,
      formulaKeys: [],
    },
    thinBloodTraits: [],
    advantages: { selections: [] },
    humanity: {
      value: 7,
      stains: 0,
      convictions: [
        {
          convictionId:
            '149e8cf4-e2ea-449a-b935-c977cb3442d4',
          text: 'Proteger a los inocentes',
          touchstoneId,
        },
      ],
      touchstones: [
        {
          touchstoneId,
          name: 'Lucía',
          relationship: 'Hermana',
        },
      ],
    },
  }
}

function validator() {
  return new CharacterValidator([
    characterCoreValidationContributor,
  ])
}

function section(report, name) {
  return report.sections.find(
    ({ section: sectionName }) =>
      sectionName === name,
  )
}

test(
  '029-C valida las secciones Core implementadas para activacion',
  () => {
    const report = validator().validate(
      validCharacter(),
      'activation',
    )

    for (const name of [
      'identity',
      'attributes',
      'skills',
      'blood',
      'humanity',
      'derived',
    ]) {
      assert.equal(section(report, name).state, 'complete')
    }

    assert.equal(section(report, 'disciplines').state, 'pending')
    assert.equal(section(report, 'advantages').state, 'pending')
    assert.equal(section(report, 'dependencies').state, 'pending')
    assert.equal(report.canProceed, false)
  },
)

test(
  '029-C permite guardar un borrador incompleto como pendiente',
  () => {
    const character = validCharacter()
    character.identity.name = ''
    character.identity.concept = null
    character.identity.clanKey = null
    character.identity.generation = null
    character.attributes = Object.fromEntries(
      Object.keys(character.attributes).map(
        (key) => [key, 1],
      ),
    )
    character.skills = Object.fromEntries(
      CHARACTER_SKILL_KEYS.map((key) => [key, 0]),
    )
    character.humanity.convictions = []
    character.humanity.touchstones = []

    const report = validator().validate(
      character,
      'draftSave',
    )

    assert.equal(report.canProceed, true)
    assert.equal(section(report, 'identity').state, 'pending')
    assert.equal(section(report, 'attributes').state, 'pending')
    assert.equal(section(report, 'skills').state, 'pending')
    assert.equal(section(report, 'blood').state, 'pending')
    assert.equal(section(report, 'humanity').state, 'pending')
    assert.ok(
      report.issues.every(
        ({ severity }) => severity === 'warning',
      ),
    )
  },
)

test(
  '029-C convierte campos pendientes en errores de activacion',
  () => {
    const character = validCharacter()
    character.identity.name = ''
    character.humanity.convictions = []
    character.humanity.touchstones = []

    const report = validator().validate(
      character,
      'activation',
    )

    assert.equal(report.canProceed, false)
    assert.equal(section(report, 'identity').state, 'invalid')
    assert.equal(section(report, 'humanity').state, 'invalid')
    assert.ok(
      report.issues.some(
        ({ code }) =>
          code === 'CHARACTER_NAME_REQUIRED',
      ),
    )
  },
)

test(
  '029-C separa errores de Atributos y Habilidades',
  () => {
    const character = validCharacter()
    character.attributes.strength = 5
    character.skills.athletics = -1

    const report = validator().validate(
      character,
      'activation',
    )

    assert.deepEqual(
      section(report, 'attributes').issues.map(
        ({ code }) => code,
      ),
      [
        'ATTRIBUTE_RATING_OUT_OF_RANGE',
        'ATTRIBUTE_DISTRIBUTION_INVALID',
      ],
    )
    assert.deepEqual(
      section(report, 'skills').issues.map(
        ({ code }) => code,
      ),
      [
        'SKILL_RATING_OUT_OF_RANGE',
        'SKILL_DISTRIBUTION_INVALID',
      ],
    )
  },
)

test(
  '029-C valida Generacion, Potencia de Sangre y Hambre conjuntamente',
  () => {
    const character = validCharacter()
    character.identity.generation = 16
    character.blood.bloodPotency = 2
    character.blood.hunger = 6

    const report = validator().validate(
      character,
      'activation',
    )

    assert.deepEqual(
      section(report, 'blood').issues.map(
        ({ code }) => code,
      ),
      [
        'BLOOD_POTENCY_INVALID_FOR_GENERATION',
        'HUNGER_VALUE_INVALID',
      ],
    )
  },
)

test(
  '029-C valida Humanidad inicial y vinculos narrativos',
  () => {
    const character = validCharacter()
    character.humanity.value = 8
    character.humanity.convictions[0].text = ''
    character.humanity.convictions[0].touchstoneId =
      'f3640450-6d98-4ddf-bc6f-a1c95667e679'

    const report = validator().validate(
      character,
      'activation',
    )
    const codes = section(
      report,
      'humanity',
    ).issues.map(({ code }) => code)

    assert.ok(
      codes.includes('INITIAL_HUMANITY_VALUE_INVALID'),
    )
    assert.ok(codes.includes('CONVICTION_DATA_INVALID'))
    assert.ok(
      codes.includes(
        'CONVICTION_TOUCHSTONE_RELATION_INVALID',
      ),
    )
  },
)

test(
  '029-C no reutiliza las reglas iniciales de Humanidad durante juego',
  () => {
    const character = validCharacter()
    character.humanity.value = 5
    character.humanity.convictions = []
    character.humanity.touchstones = []

    const report = validator().validate(
      character,
      'play',
    )

    assert.equal(section(report, 'humanity').state, 'complete')
    assert.deepEqual(section(report, 'humanity').issues, [])
  },
)

test(
  '029-C revalida el daño contra capacidades derivadas',
  () => {
    const character = validCharacter()
    character.damage.health.aggravated = 7

    const report = validator().validate(
      character,
      'play',
    )

    assert.deepEqual(
      section(report, 'derived').issues.map(
        ({ code }) => code,
      ),
      ['HEALTH_DAMAGE_EXCEEDS_CAPACITY'],
    )
  },
)
