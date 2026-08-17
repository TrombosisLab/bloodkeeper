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
  '057-E3B persiste concesiones predatorType sin XP',
  async () => {
    const database =
      new DatabaseService()

    await database.$connect()

    const repository =
      new PrismaCharacterDraftRepository(
        database,
      )

    const ownerId = randomUUID()
    let characterId = null

    try {
      await database.user.create({
        data: {
          id: ownerId,
          username:
            `spec057e3b-${ownerId}`,
          displayName:
            'SPEC-057-E3B',
          passwordHash:
            'integration-test-only',
        },
      })

      const human =
        await repository.create({
          ownerId,
          chronicleId: null,
          identity: {
            name: 'E3-B',
            concept: 'Sesión 0',
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
        })

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
              throw new Error('unused')
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
            clanKey: 'brujah',
          },
        )

      const generation =
        await useCase.resolveGeneration(
          ownerId,
          {
            characterId,
            expectedRevision:
              clan.character.revision,
            generation: 13,
          },
        )

      const blood =
        await useCase.establishBlood(
          ownerId,
          {
            characterId,
            expectedRevision:
              generation.character.revision,
            bloodPotency: 1,
            hunger: 1,
          },
        )

      const adopted =
        await useCase.adoptPredatorType(
          ownerId,
          {
            characterId,
            expectedRevision:
              blood.character.revision,
            predatorTypeKey: 'bagger',
            predatorTypeChoices: {
              'bagger-specialty': 0,
              'bagger-discipline': 1,
            },
            disciplinePowerKey:
              'obfuscate-cloak-of-shadows',
            advantages:
              predatorAdvantages(),
          },
        )

      assert.equal(
        adopted.character.identity.predatorTypeKey,
        'bagger',
      )

      assert.equal(
        adopted.character.humanity.value,
        6,
      )

      assert.equal(
        adopted.character.skills.larceny,
        1,
      )

      const predatorDisciplines =
        await database.characterDiscipline.findMany({
          where: {
            characterId,
            origin: 'PREDATOR_TYPE',
          },
          include: {
            powers: true,
          },
        })

      assert.equal(
        predatorDisciplines.length,
        1,
      )

      assert.equal(
        predatorDisciplines[0].contributionKey,
        'predatorType',
      )

      assert.equal(
        await database.characterExperienceMovement.count({
          where: { characterId },
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
