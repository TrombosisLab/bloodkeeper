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

function humanCreateData(
  ownerId,
) {
  return {
    ownerId,
    chronicleId: null,
    identity: {
      name: 'Humano E1',
      concept:
        'Transición progresiva',
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

test(
  '057-E1 persiste identidad vampírica inicial y Sangre sin XP ni defaults ficticios',
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
            `spec057e1-${ownerId}`,
          displayName:
            'SPEC-057-E1 owner',
          passwordHash:
            'integration-test-only',
        },
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
            clanKey: 'brujah',
          },
        )

      const sire =
        await useCase.resolveSire(
          ownerId,
          {
            characterId,
            expectedRevision:
              clan.character.revision,
            sire: 'Helena',
          },
        )

      const generation =
        await useCase.resolveGeneration(
          ownerId,
          {
            characterId,
            expectedRevision:
              sire.character.revision,
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
            hunger: 2,
          },
        )

      assert.equal(
        blood.character.identity.clanKey,
        'brujah',
      )
      assert.equal(
        blood.character.identity.generation,
        13,
      )
      assert.equal(
        blood.character.identity.sire,
        'Helena',
      )

      assert.deepEqual(
        blood.character.blood,
        {
          bloodPotency: 1,
          hunger: 2,
          resonance: null,
        },
      )
      assert.equal(
        blood.character.humanity.value,
        6,
      )
      assert.equal(
        blood.character.humanity.stains,
        1,
      )
      assert.equal(
        blood.character.thinBloodAlchemy,
        null,
      )
      assert.deepEqual(
        blood.character.disciplines,
        [],
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
