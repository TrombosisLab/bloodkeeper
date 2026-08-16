import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CharacterValidator,
} from '../dist/characters/domain/character-validator.js'

import {
  characterCoreValidationContributor,
} from '../dist/characters/domain/character-core-validation.contributor.js'

import {
  createCharacterAdvantageValidationContributor,
} from '../dist/characters/domain/character-advantage-validation.contributor.js'

import {
  createCharacterDependencyValidationContributor,
} from '../dist/characters/domain/character-dependency-validation.contributor.js'

import {
  createCharacterDisciplineValidationContributor,
} from '../dist/characters/domain/character-discipline-validation.contributor.js'

import {
  characterRulesCatalog,
} from '../dist/characters/domain/character-rules-catalog.js'

import {
  CHARACTER_SKILL_KEYS,
} from '../dist/characters/domain/persisted-character.types.js'

const validator = new CharacterValidator([
  characterCoreValidationContributor,
  createCharacterDisciplineValidationContributor(
    characterRulesCatalog,
  ),
  createCharacterAdvantageValidationContributor(
    characterRulesCatalog,
  ),
  createCharacterDependencyValidationContributor(
    characterRulesCatalog,
  ),
])

function transitional(overrides = {}) {
  return {
    characterId:
      '11111111-1111-4111-8111-111111111111',
    ownerId:
      '22222222-2222-4222-8222-222222222222',
    chronicleId: null,
    status: 'active',
    nature: 'vampire',
    revision: 2,
    identity: {
      name: 'Recién Abrazado',
      concept: 'Sesión 0',
      predatorTypeKey: null,
      ambition: null,
      clanKey: null,
      sire: null,
      desire: null,
      generation: null,
      ageCategory: null,
    },
    creation: {
      schemaVersion: 1,
      currentStep: 'review',
      creationMode: 'sessionZero',
      skillDistributionMethod: 'balanced',
      predatorTypeChoices: {},
      updatedAt: new Date(),
    },
    attributes: {
      strength: 1,
      dexterity: 1,
      stamina: 1,
      charisma: 1,
      manipulation: 1,
      composure: 1,
      intelligence: 1,
      wits: 1,
      resolve: 1,
    },
    blood: null,
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
    skills: Object.fromEntries(
      CHARACTER_SKILL_KEYS.map(
        (key) => [key, 0],
      ),
    ),
    skillSpecialties: [],
    disciplines: [],
    bloodSorceryRituals: {
      ritualKeys: [],
    },
    oblivionCeremonies: {
      ceremonyKeys: [],
    },
    thinBloodAlchemy: null,
    thinBloodTraits: [],
    advantages: {
      selections: [],
    },
    humanity: {
      value: 6,
      stains: 1,
      convictions: [],
      touchstones: [],
    },
    updatedAt: new Date(),
    ...overrides,
  }
}

function codes(report) {
  return report.issues.map(
    ({code}) => code,
  )
}

test(
  '057-E1 play permite pendientes sólo a VAMPIRE + SESSION_ZERO',
  () => {
    const report =
      validator.validate(
        transitional(),
        'play',
      )

    assert.equal(report.canProceed, true)
    assert.equal(report.valid, false)

    for (
      const code of [
        'CHARACTER_CLAN_REQUIRED',
        'CHARACTER_GENERATION_REQUIRED',
        'CHARACTER_VAMPIRE_BLOOD_STATE_REQUIRED',
      ]
    ) {
      assert.ok(codes(report).includes(code))
      assert.ok(
        report.issues.some(
          (issue) =>
            issue.code === code &&
            issue.severity === 'warning',
        ),
      )
    }
  },
)

test(
  '057-E1 activation y evolution mantienen pendientes como error',
  () => {
    for (
      const context of
        ['activation', 'evolution']
    ) {
      const report =
        validator.validate(
          transitional(),
          context,
        )

      assert.equal(
        report.canProceed,
        false,
        context,
      )
      assert.ok(
        report.issues.some(
          ({severity}) =>
            severity === 'error',
        ),
        context,
      )
    }
  },
)

test(
  '057-E1 STANDARD conserva validación estricta',
  () => {
    const base = transitional()
    const report =
      validator.validate(
        {
          ...base,
          creation: {
            ...base.creation,
            creationMode: 'standard',
          },
        },
        'play',
      )

    assert.equal(report.canProceed, false)
    assert.ok(
      report.issues.some(
        ({severity}) =>
          severity === 'error',
      ),
    )
  },
)
