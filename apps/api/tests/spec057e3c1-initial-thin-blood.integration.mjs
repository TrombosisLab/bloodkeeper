import assert from 'node:assert/strict'
import {
  randomUUID,
} from 'node:crypto'
import test from 'node:test'

import {
  DatabaseService,
} from '../dist/database/database.service.js'

import {
  InitialVampireDecisionAlreadyResolvedError,
  ResolveInitialVampireStateUseCase,
} from '../dist/characters/application/resolve-initial-vampire-state.use-case.js'

import {
  PrismaCharacterDraftRepository,
} from '../dist/characters/infrastructure/prisma-character-draft.repository.js'

import {
  characterRulesCatalog,
} from '../dist/characters/domain/character-rules-catalog.js'

import {
  CHARACTER_SKILL_KEYS,
} from '../dist/characters/domain/persisted-character.types.js'

function humanCreateData(
  ownerId,
) {
  return {
    ownerId,
    chronicleId: null,
    identity: {
      name: 'Humano E3-C1',
      concept: 'Sangre Débil',
      predatorTypeKey: null,
      ambition: null,
      clanKey: null,
      sire: null,
      desire: null,
      generation: null,
      ageCategory: null,
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
    creation: {
      creationMode: 'sessionZero',
      currentStep: 'review',
      skillDistributionMethod:
        'balanced',
      predatorTypeChoices: {},
    },
  }
}

function traits() {
  return [
    {
      definitionKey:
        'discipline-affinity',
      clanCurseDetails: null,
      disciplineAffinityDetails: {
        disciplineKey: 'auspex',
        powerKey:
          'auspex-heightened-senses',
      },
    },
    {
      definitionKey:
        'thin-blood-alchemist',
      clanCurseDetails: null,
      disciplineAffinityDetails: null,
    },
    {
      definitionKey:
        'day-drinker',
      clanCurseDetails: null,
      disciplineAffinityDetails: null,
    },
    {
      definitionKey:
        'baby-teeth',
      clanCurseDetails: null,
      disciplineAffinityDetails: null,
    },
    {
      definitionKey:
        'vitae-dependency',
      clanCurseDetails: null,
      disciplineAffinityDetails: null,
    },
    {
      definitionKey:
        'camarilla-branded',
      clanCurseDetails: null,
      disciplineAffinityDetails: null,
    },
  ]
}

test(
  '057-E3C1 persiste perfil Thin Blood atómico con afinidad y Alquimia sin XP ni historial nuevo',
  async () => {
    const database =
      new DatabaseService()
    const repository =
      new PrismaCharacterDraftRepository(
        database,
      )
    const ownerId = randomUUID()
    const foreignOwnerId = randomUUID()
    let characterId = null

    await database.$connect()

    try {
      await database.user.createMany({
        data: [
          {
            id: ownerId,
            username:
              `spec057e3c1-${ownerId}`,
            displayName:
              'SPEC-057-E3C1 owner',
            passwordHash:
              'integration-test-only',
          },
          {
            id: foreignOwnerId,
            username:
              `spec057e3c1-${foreignOwnerId}`,
            displayName:
              'SPEC-057-E3C1 foreign',
            passwordHash:
              'integration-test-only',
          },
        ],
      })

      const human =
        await repository.create(
          humanCreateData(ownerId),
        )

      characterId =
        human.characterId

      const embraced =
        await repository.embrace({
          characterId,
          expectedRevision:
            human.revision,
          historyEntryId:
            randomUUID(),
        })

      const useCase =
        new ResolveInitialVampireStateUseCase(
          repository,
          {
            async findActiveMembership() {
              throw new Error(
                'Membership no debe consultarse sin Crónica',
              )
            },
          },
          characterRulesCatalog,
        )

      const clan =
        await useCase.resolveClan(
          ownerId,
          {
            characterId,
            expectedRevision:
              embraced.revision,
            clanKey: 'thinBlood',
          },
        )

      const generation =
        await useCase.resolveGeneration(
          ownerId,
          {
            characterId,
            expectedRevision:
              clan.character.revision,
            generation: 14,
          },
        )

      const blood =
        await useCase.establishBlood(
          ownerId,
          {
            characterId,
            expectedRevision:
              generation.character.revision,
            bloodPotency: 0,
            hunger: 1,
          },
        )

      const beforeRevision =
        blood.character.revision

      const historyBefore =
        await database.characterHistoryEntry.count({
          where: {
            characterId,
          },
        })

      await assert.rejects(
        useCase.resolveThinBloodState(
          foreignOwnerId,
          {
            characterId,
            expectedRevision:
              beforeRevision,
            thinBloodTraits: traits(),
            thinBloodAlchemy: {
              rating: 1,
              method: 'fixatio',
              formulaKeys: [
                'farReach',
              ],
            },
          },
        ),
      )

      await assert.rejects(
        useCase.resolveThinBloodState(
          ownerId,
          {
            characterId,
            expectedRevision:
              beforeRevision - 1,
            thinBloodTraits: traits(),
            thinBloodAlchemy: {
              rating: 1,
              method: 'fixatio',
              formulaKeys: [
                'farReach',
              ],
            },
          },
        ),
      )

      assert.equal(
        await database.characterThinBloodTrait.count({
          where: {
            characterId,
          },
        }),
        0,
      )

      assert.equal(
        await database.characterThinBloodAlchemyState.count({
          where: {
            characterId,
          },
        }),
        0,
      )

      const resolved =
        await useCase.resolveThinBloodState(
          ownerId,
          {
            characterId,
            expectedRevision:
              beforeRevision,
            thinBloodTraits: traits(),
            thinBloodAlchemy: {
              rating: 1,
              method: 'fixatio',
              formulaKeys: [
                'farReach',
              ],
            },
          },
        )

      assert.equal(
        resolved.character.revision,
        beforeRevision + 1,
      )

      assert.equal(
        resolved.character.thinBloodTraits.length,
        6,
      )

      assert.deepEqual(
        resolved.character.thinBloodAlchemy,
        {
          rating: 1,
          method: 'fixatio',
          formulaKeys: [
            'farReach',
          ],
        },
      )

      assert.equal(
        resolved.pendingDecisions.includes(
          'thinBloodState',
        ),
        false,
      )

      assert.equal(
        resolved.pendingDecisions.includes(
          'predatorType',
        ),
        false,
      )

      assert.equal(
        resolved.character.identity.predatorTypeKey,
        null,
      )

      const thinBloodDisciplines =
        await database.characterDiscipline.findMany({
          where: {
            characterId,
            origin: 'THIN_BLOOD',
          },
          include: {
            powers: true,
          },
        })

      assert.equal(
        thinBloodDisciplines.length,
        1,
      )

      assert.equal(
        thinBloodDisciplines[0].disciplineKey,
        'auspex',
      )

      assert.equal(
        thinBloodDisciplines[0].contributionKey,
        'thinBlood',
      )

      assert.deepEqual(
        thinBloodDisciplines[0].powers.map(
          ({ powerKey }) => powerKey,
        ),
        [
          'auspex-heightened-senses',
        ],
      )

      assert.equal(
        await database.characterExperienceMovement.count({
          where: {
            characterId,
          },
        }),
        0,
      )

      assert.equal(
        await database.characterHistoryEntry.count({
          where: {
            characterId,
          },
        }),
        historyBefore,
      )

      await assert.rejects(
        useCase.resolveThinBloodState(
          ownerId,
          {
            characterId,
            expectedRevision:
              resolved.character.revision,
            thinBloodTraits: traits(),
            thinBloodAlchemy: {
              rating: 1,
              method: 'fixatio',
              formulaKeys: [
                'farReach',
              ],
            },
          },
        ),
        InitialVampireDecisionAlreadyResolvedError,
      )
    } finally {
      if (characterId !== null) {
        await database.character.deleteMany({
          where: {
            id: characterId,
          },
        })
      }

      await database.user.deleteMany({
        where: {
          id: {
            in: [
              ownerId,
              foreignOwnerId,
            ],
          },
        },
      })

      await database.$disconnect()
    }
  },
)
