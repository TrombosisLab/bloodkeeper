import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InitialVampireDecisionAlreadyResolvedError,
  ResolveInitialVampireStateUseCase,
} from '../dist/characters/application/resolve-initial-vampire-state.use-case.js'

import {
  characterRulesCatalog,
} from '../dist/characters/domain/character-rules-catalog.js'

import {
  CHARACTER_SKILL_KEYS,
} from '../dist/characters/domain/persisted-character.types.js'

const ownerId =
  '11111111-1111-4111-8111-111111111111'
const characterId =
  '22222222-2222-4222-8222-222222222222'

function currentCharacter() {
  return {
    characterId,
    ownerId,
    chronicleId: null,
    status: 'active',
    nature: 'vampire',
    revision: 5,
    identity: {
      name: 'E3-B',
      concept: 'Adopción',
      predatorTypeKey: null,
      ambition: null,
      clanKey: 'brujah',
      sire: null,
      desire: null,
      generation: 13,
      ageCategory: 'neonate',
    },
    creation: {
      schemaVersion: 1,
      creationMode: 'sessionZero',
      currentStep: 'review',
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
  }
}

function predatorAdvantages() {
  return {
    selections: [
      {
        selectionId: 'predator-iron',
        definitionKey: 'iron-stomach',
        category: 'merit',
        rating: 3,
        origin: 'predatorType',
        parentSelectionId: null,
        details: null,
      },
      {
        selectionId: 'predator-enemy',
        definitionKey: 'enemy',
        category: 'flaw',
        rating: 2,
        origin: 'predatorType',
        parentSelectionId: null,
        details: {
          kind: 'enemy',
          identity: 'Proveedor',
        },
      },
    ],
  }
}

test(
  '057-E3B adopta una sola vez',
  async () => {
    let current = currentCharacter()

    const repository = {
      async findByCharacterId() {
        return current
      },
      async resolveInitialVampireState(data) {
        current = {
          ...current,
          revision: current.revision + 1,
          identity: {
            ...current.identity,
            predatorTypeKey:
              data.predatorTypeKey,
          },
          creation: {
            ...current.creation,
            predatorTypeChoices:
              data.predatorTypeChoices,
          },
          skills:
            data.bonusSkillKey === null
              ? current.skills
              : {
                  ...current.skills,
                  [data.bonusSkillKey]:
                    current.skills[
                      data.bonusSkillKey
                    ] + 1,
                },
          skillSpecialties:
            data.specialty === null
              ? current.skillSpecialties
              : [
                  ...current.skillSpecialties,
                  data.specialty,
                ],
          disciplines: [
            ...current.disciplines,
            {
              disciplineKey:
                data.discipline.disciplineKey,
              rating:
                data.discipline.rating,
              powerKeys: [
                data.discipline.powerKey,
              ],
              origin: 'predatorType',
            },
          ],
          advantages: {
            selections: [
              ...current.advantages.selections,
              ...data.advantages.selections,
            ],
          },
          humanity: {
            ...current.humanity,
            value: data.humanityValue,
          },
          blood: {
            ...current.blood,
            bloodPotency:
              data.bloodPotency,
          },
        }

        return current
      },
    }

    const useCase =
      new ResolveInitialVampireStateUseCase(
        repository,
        {
          async findActiveMembership() {
            throw new Error('unused')
          },
        },
        characterRulesCatalog,
      )

    const command = {
      characterId,
      expectedRevision: 5,
      predatorTypeKey: 'bagger',
      predatorTypeChoices: {
        'bagger-specialty': 0,
        'bagger-discipline': 1,
      },
      disciplinePowerKey:
        'obfuscate-cloak-of-shadows',
      advantages:
        predatorAdvantages(),
    }

    const result =
      await useCase.adoptPredatorType(
        ownerId,
        command,
      )

    assert.equal(
      result.character.identity.predatorTypeKey,
      'bagger',
    )

    await assert.rejects(
      useCase.adoptPredatorType(
        ownerId,
        {
          ...command,
          expectedRevision:
            result.character.revision,
        },
      ),
      InitialVampireDecisionAlreadyResolvedError,
    )
  },
)
