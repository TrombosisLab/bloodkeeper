import assert from 'node:assert/strict'
import test from 'node:test'

import {
  characterMortalAdvantageExclusionCatalog,
} from '@v5r/character-rules'

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
      (key, index) => [
        key,
        ratings[index] ?? 0,
      ],
    ),
  )
}

function specialties() {
  return [
    {
      id: 'free',
      skillKey: 'drive',
      name: 'Motocicletas',
      origin: 'creation',
    },
    {
      id: 'craft',
      skillKey: 'craft',
      name: 'Carpintería',
      origin: 'creation',
    },
    {
      id: 'performance',
      skillKey: 'performance',
      name: 'Canto',
      origin: 'creation',
    },
  ]
}

function selections() {
  return [
    {
      selectionId: 'resources-1',
      definitionKey: 'resources',
      category: 'background',
      rating: 5,
      origin: 'creation',
      parentSelectionId: null,
      details: {
        kind: 'resources',
        source: 'Patrimonio',
      },
    },
    {
      selectionId: 'contacts-1',
      definitionKey: 'contacts',
      category: 'background',
      rating: 2,
      origin: 'creation',
      parentSelectionId: null,
      details: {
        kind: 'contact',
        identity: 'Periodista',
      },
    },
    {
      selectionId: 'enemy-1',
      definitionKey: 'enemy',
      category: 'flaw',
      rating: 2,
      origin: 'creation',
      parentSelectionId: null,
      details: {
        kind: 'enemy',
        identity: 'Rival profesional',
      },
    },
  ]
}

function human(overrides = {}) {
  const touchstoneId =
    '2d4a0e25-89b9-4f07-a832-3ce00c1d8f31'

  const base = {
    characterId:
      'b7a24d30-0ef3-49b2-a416-f141791808ce',
    ownerId:
      'a605993e-b5e5-47bc-8a4a-698c0f770870',
    chronicleId: null,
    status: 'draft',
    nature: 'human',
    revision: 1,
    createdAt:
      new Date('2026-08-16T18:00:00Z'),
    updatedAt:
      new Date('2026-08-16T18:00:00Z'),
    identity: {
      name: 'Marta',
      concept: 'Periodista de investigación',
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
      updatedAt:
        new Date('2026-08-16T18:00:00Z'),
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
    skills: balancedSkills(),
    skillSpecialties: specialties(),
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
      selections: selections(),
    },
    humanity: {
      value: 7,
      stains: 0,
      convictions: [
        {
          convictionId: 'conviction-1',
          text: 'La verdad merece ser conocida',
          touchstoneId,
        },
      ],
      touchstones: [
        {
          touchstoneId,
          name: 'Daniel',
          relationship: 'Hermano',
        },
      ],
    },
  }

  return {
    ...base,
    ...overrides,
    identity: {
      ...base.identity,
      ...(overrides.identity ?? {}),
    },
    creation: {
      ...base.creation,
      ...(overrides.creation ?? {}),
    },
    humanity: {
      ...base.humanity,
      ...(overrides.humanity ?? {}),
    },
  }
}

function validator() {
  return new CharacterValidator([
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
}

function codes(report) {
  return report.issues.map(
    ({ code }) => code,
  )
}

test(
  'SPEC-057-B activa SESSION_ZERO + HUMAN sin estados vampíricos ficticios',
  () => {
    const report =
      validator().validate(
        human(),
        'activation',
      )

    assert.equal(
      report.canProceed,
      true,
      JSON.stringify(report.issues, null, 2),
    )

    assert.equal(report.valid, true)
  },
)

test(
  'SPEC-057-B exige Humanidad 7 sólo en la primera activación humana',
  () => {
    const first =
      validator().validate(
        human({
          humanity: { value: 6 },
        }),
        'activation',
      )

    assert.ok(
      codes(first).includes(
        'CHARACTER_HUMAN_INITIAL_HUMANITY_INVALID',
      ),
    )

    const reactivation =
      validator().validate(
        human({
          status: 'archived',
          humanity: { value: 6 },
        }),
        'activation',
      )

    assert.ok(
      !codes(reactivation).includes(
        'CHARACTER_HUMAN_INITIAL_HUMANITY_INVALID',
      ),
    )
  },
)

test(
  'SPEC-057-B rechaza estado vampírico en humano',
  () => {
    const report =
      validator().validate(
        human({
          blood: {
            bloodPotency: 1,
            hunger: 1,
          },
          disciplines: [
            {
              disciplineKey: 'auspex',
              rating: 1,
              powerKeys: [
                'heightened-senses',
              ],
              origin: 'creation',
            },
          ],
          thinBloodAlchemy: {
            rating: 0,
            method: null,
            formulaKeys: [],
          },
          identity: {
            clanKey: 'brujah',
            generation: 13,
            predatorTypeKey: 'sandman',
          },
        }),
        'activation',
      )

    const result = codes(report)

    assert.ok(
      result.includes(
        'CHARACTER_HUMAN_BLOOD_STATE_FORBIDDEN',
      ),
    )
    assert.ok(
      result.includes(
        'CHARACTER_HUMAN_DISCIPLINES_FORBIDDEN',
      ),
    )
    assert.ok(
      result.includes(
        'CHARACTER_HUMAN_CLAN_FORBIDDEN',
      ),
    )
    assert.ok(
      result.includes(
        'CHARACTER_HUMAN_GENERATION_FORBIDDEN',
      ),
    )
    assert.ok(
      result.includes(
        'CHARACTER_HUMAN_PREDATOR_TYPE_FORBIDDEN',
      ),
    )
  },
)

test(
  'SPEC-057-B no permite HUMAN con modo STANDARD',
  () => {
    const report =
      validator().validate(
        human({
          creation: {
            creationMode: 'standard',
          },
        }),
        'activation',
      )

    assert.ok(
      codes(report).includes(
        'CHARACTER_HUMAN_CREATION_MODE_INVALID',
      ),
    )
  },
)

test(
  'SPEC-057-B mantiene 7 puntos de Ventajas y 2 de Defectos',
  () => {
    const invalid =
      human()

    invalid.advantages = {
      selections:
        invalid.advantages.selections
          .filter(
            ({ definitionKey }) =>
              definitionKey !== 'contacts',
          ),
    }

    const report =
      validator().validate(
        invalid,
        'activation',
      )

    assert.ok(
      codes(report).includes(
        'CHARACTER_ADVANTAGE_CREATION_BUDGET_INVALID',
      ),
    )
  },
)

test(
  'SPEC-057-B bloquea categorías de Ventajas prohibidas a mortales y conserva Refugio como elegible',
  () => {
    const excluded =
      Object.values(
        characterMortalAdvantageExclusionCatalog,
      ).flat()

    for (const key of [
      'status',
      'herd',
      'archaic',
      'vegan',
      'stake-bait',
    ]) {
      assert.ok(excluded.includes(key))
    }

    assert.ok(!excluded.includes('haven'))

    const character = human()

    character.advantages.selections = [
      {
        selectionId: 'status-1',
        definitionKey: 'status',
        category: 'background',
        rating: 5,
        origin: 'creation',
        parentSelectionId: null,
        details: {
          kind: 'status',
          sphere: 'Camarilla',
        },
      },
      {
        selectionId: 'resources-1',
        definitionKey: 'resources',
        category: 'background',
        rating: 2,
        origin: 'creation',
        parentSelectionId: null,
        details: {
          kind: 'resources',
          source: 'Trabajo',
        },
      },
      {
        selectionId: 'enemy-1',
        definitionKey: 'enemy',
        category: 'flaw',
        rating: 2,
        origin: 'creation',
        parentSelectionId: null,
        details: null,
      },
    ]

    const report =
      validator().validate(
        character,
        'activation',
      )

    assert.ok(
      codes(report).includes(
        'CHARACTER_HUMAN_ADVANTAGE_NOT_ALLOWED',
      ),
    )
  },
)
