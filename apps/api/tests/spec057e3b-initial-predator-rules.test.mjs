import assert from 'node:assert/strict'
import test from 'node:test'

import {
  analyzeInitialPredatorAdoption,
} from '../dist/characters/domain/character-initial-predator.rules.js'

import {
  characterRulesCatalog,
} from '../dist/characters/domain/character-rules-catalog.js'

import {
  CHARACTER_SKILL_KEYS,
} from '../dist/characters/domain/persisted-character.types.js'

function predatorAdvantages() {
  return {
    selections: [
      {
        selectionId:
          'predatorType:bagger:iron-stomach',
        definitionKey: 'iron-stomach',
        category: 'merit',
        rating: 3,
        origin: 'predatorType',
        parentSelectionId: null,
        details: null,
      },
      {
        selectionId:
          'predatorType:bagger:enemy',
        definitionKey: 'enemy',
        category: 'flaw',
        rating: 2,
        origin: 'predatorType',
        parentSelectionId: null,
        details: {
          kind: 'enemy',
          identity: 'Proveedor hostil',
        },
      },
    ],
  }
}

function character(overrides = {}) {
  const identity = {
    name: 'Sesión 0',
    concept: 'E3-B',
    predatorTypeKey: null,
    ambition: null,
    clanKey: 'brujah',
    sire: null,
    desire: null,
    generation: 13,
    ageCategory: 'neonate',
  }

  return {
    characterId:
      '11111111-1111-4111-8111-111111111111',
    ownerId:
      '22222222-2222-4222-8222-222222222222',
    chronicleId: null,
    status: 'active',
    nature: 'vampire',
    revision: 9,
    identity,
    creation: {
      schemaVersion: 1,
      creationMode: 'sessionZero',
      currentStep: 'review',
      skillDistributionMethod:
        'balanced',
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
    skills: Object.fromEntries(
      CHARACTER_SKILL_KEYS.map(
        key => [key, 0],
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
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
    identity: {
      ...identity,
      ...(overrides.identity ?? {}),
    },
  }
}

function baggerInput(overrides = {}) {
  return {
    predatorTypeKey: 'bagger',
    predatorTypeChoices: {
      'bagger-specialty': 0,
      'bagger-discipline': 1,
    },
    disciplinePowerKey:
      'obfuscate-cloak-of-shadows',
    advantages:
      predatorAdvantages(),
    ...overrides,
  }
}

test(
  '057-E3B Habilidad 0 recibe punto, no Especialidad',
  () => {
    const analysis =
      analyzeInitialPredatorAdoption(
        character(),
        baggerInput(),
        characterRulesCatalog,
      )

    assert.deepEqual(
      analysis.issues,
      [],
    )
    assert.ok(analysis.plan)
    assert.equal(
      analysis.plan.bonusSkillKey,
      'larceny',
    )
    assert.equal(
      analysis.plan.specialty,
      null,
    )
  },
)

test(
  '057-E3B Habilidad existente recibe Especialidad',
  () => {
    const source = character()
    source.skills.larceny = 1

    const analysis =
      analyzeInitialPredatorAdoption(
        source,
        baggerInput(),
        characterRulesCatalog,
      )

    assert.deepEqual(
      analysis.issues,
      [],
    )
    assert.ok(analysis.plan)
    assert.equal(
      analysis.plan.bonusSkillKey,
      null,
    )
    assert.equal(
      analysis.plan.specialty?.skillKey,
      'larceny',
    )
  },
)

test(
  '057-E3B rechaza Sangre Débil',
  () => {
    const analysis =
      analyzeInitialPredatorAdoption(
        character({
          identity: {
            clanKey: 'thinBlood',
            generation: 14,
          },
          blood: {
            bloodPotency: 0,
            hunger: 1,
          },
        }),
        baggerInput(),
        characterRulesCatalog,
      )

    assert.ok(
      analysis.issues.some(
        ({ code }) =>
          code ===
            'CHARACTER_PREDATOR_TYPE_THIN_BLOOD_FORBIDDEN',
      ),
    )
  },
)
