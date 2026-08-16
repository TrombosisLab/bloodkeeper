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

function humanCreateData(ownerId) {
  return {
    ownerId,
    chronicleId: null,
    identity: {
      name: 'Humano E2',
      concept:
        'Disciplinas diferidas',
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
  '057-E2 persiste 2+1 y tres Poderes como creation sin XP/EVOLUTION',
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
            `spec057e2-${ownerId}`,
          displayName:
            'SPEC-057-E2 owner',
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
            clanKey: 'brujah',
          },
        )

      const celerity =
        await useCase.manifestDiscipline(
          ownerId,
          {
            characterId,
            expectedRevision:
              clan.character.revision,
            disciplineKey: 'celerity',
            rating: 2,
          },
        )

      const celerityOne =
        await useCase.manifestPower(
          ownerId,
          {
            characterId,
            expectedRevision:
              celerity.character.revision,
            disciplineKey: 'celerity',
            powerKey:
              'celerity-cats-grace',
          },
        )

      const celerityTwo =
        await useCase.manifestPower(
          ownerId,
          {
            characterId,
            expectedRevision:
              celerityOne.character.revision,
            disciplineKey: 'celerity',
            powerKey:
              'celerity-rapid-reflexes',
          },
        )

      const potence =
        await useCase.manifestDiscipline(
          ownerId,
          {
            characterId,
            expectedRevision:
              celerityTwo.character.revision,
            disciplineKey: 'potence',
            rating: 1,
          },
        )

      assert.equal(
        potence.pendingDecisions.includes(
          'initialDisciplines',
        ),
        false,
      )
      assert.equal(
        potence.pendingDecisions.includes(
          'initialPowers',
        ),
        true,
      )

      const completed =
        await useCase.manifestPower(
          ownerId,
          {
            characterId,
            expectedRevision:
              potence.character.revision,
            disciplineKey: 'potence',
            powerKey:
              'potence-lethal-body',
          },
        )

      assert.equal(
        completed.pendingDecisions.includes(
          'initialDisciplines',
        ),
        false,
      )
      assert.equal(
        completed.pendingDecisions.includes(
          'initialPowers',
        ),
        false,
      )
      assert.equal(
        completed.character.humanity.value,
        6,
      )
      assert.equal(
        completed.character.humanity.stains,
        1,
      )

      const rows =
        await database.characterDiscipline
          .findMany({
            where: {
              characterId,
            },
            include: {
              powers: true,
            },
          })

      assert.equal(rows.length, 2)
      assert.ok(
        rows.every(
          ({ contributionKey, origin }) =>
            contributionKey ===
              'creation' &&
            origin === 'CREATION',
        ),
      )
      assert.equal(
        rows.reduce(
          (total, row) =>
            total + row.rating,
          0,
        ),
        3,
      )
      assert.equal(
        rows.reduce(
          (total, row) =>
            total + row.powers.length,
          0,
        ),
        3,
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

      assert.equal(
        await database
          .characterDiscipline
          .count({
            where: {
              characterId,
              origin: 'EVOLUTION',
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
