import assert from 'node:assert/strict'
import {
  randomUUID,
} from 'node:crypto'
import test from 'node:test'

import {
  DatabaseService,
} from '../dist/database/database.service.js'

import {
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

function selections() {
  return [
    {
      selectionId: 'resources',
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
      selectionId: 'contacts',
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
      selectionId: 'vegan',
      definitionKey: 'vegan',
      category: 'flaw',
      rating: 2,
      origin: 'creation',
      parentSelectionId: null,
      details: null,
    },
  ]
}

function createData(ownerId) {
  return {
    ownerId,
    chronicleId: null,
    identity: {
      name: 'Humano E3A',
      concept: 'Revisión de Ventajas',
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
      selections: selections(),
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
      skillDistributionMethod: 'balanced',
      predatorTypeChoices: {},
    },
  }
}

test(
  '057-E3A reemplaza creación 7/2 atómicamente sin XP y preserva Humanidad',
  async () => {
    const database =
      new DatabaseService()
    const repository =
      new PrismaCharacterDraftRepository(
        database,
      )
    const ownerId = randomUUID()
    let characterId = null

    await database.$connect()

    try {
      await database.user.create({
        data: {
          id: ownerId,
          username:
            `spec057e3a-${ownerId}`,
          displayName:
            'SPEC-057-E3A owner',
          passwordHash:
            'integration-test-only',
        },
      })

      const human =
        await repository.create(
          createData(ownerId),
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
                'No membership without Chronicle',
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
            clanKey: 'ventrue',
          },
        )

      const replacement = {
        selections: [
          selections()[0],
          selections()[1],
          {
            selectionId: 'enemy',
            definitionKey: 'enemy',
            category: 'flaw',
            rating: 2,
            origin: 'creation',
            parentSelectionId: null,
            details: {
              kind: 'enemy',
              identity: 'Rival',
            },
          },
        ],
      }

      const reviewed =
        await useCase.reviewAdvantages(
          ownerId,
          {
            characterId,
            expectedRevision:
              clan.character.revision,
            advantages: replacement,
          },
        )

      assert.equal(
        reviewed.pendingDecisions.includes(
          'advantagesReview',
        ),
        false,
      )
      assert.equal(
        reviewed.character.humanity.value,
        6,
      )
      assert.equal(
        reviewed.character.humanity.stains,
        1,
      )

      assert.deepEqual(
        reviewed.character.advantages
          .selections
          .filter(
            ({ origin }) =>
              origin === 'creation',
          )
          .map(
            ({ definitionKey }) =>
              definitionKey,
          )
          .sort(),
        [
          'contacts',
          'enemy',
          'resources',
        ],
      )

      assert.equal(
        await database
          .characterExperienceMovement
          .count({
            where: {
              characterId,
            },
          }),
        0,
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
          id: ownerId,
        },
      })

      await database.$disconnect()
    }
  },
)
