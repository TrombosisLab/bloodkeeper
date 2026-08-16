import assert from 'node:assert/strict'
import {
  randomUUID,
} from 'node:crypto'
import test from 'node:test'

import {
  DatabaseService,
} from '../dist/database/database.service.js'

import {
  CharacterEmbraceWriteConflictError,
} from '../dist/characters/application/character-draft.repository.js'

import {
  PrismaCharacterDraftRepository,
} from '../dist/characters/infrastructure/prisma-character-draft.repository.js'

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
      name: 'Humano 057-D',
      concept:
        'Test atómico de Abrazo',
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
  '057-D persiste HUMAN→VAMPIRE e Historial en una única transacción',
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
            `spec057d-${ownerId}`,
          displayName:
            'SPEC-057-D owner',
          passwordHash:
            'integration-test-only',
        },
      })

      const created =
        await repository.create(
          humanCreateData(ownerId),
        )

      characterId =
        created.characterId

      assert.equal(
        created.nature,
        'human',
      )
      assert.equal(
        created.creation.creationMode,
        'sessionZero',
      )
      assert.equal(
        created.humanity.value,
        6,
      )
      assert.equal(
        created.blood,
        null,
      )

      const collisionId =
        randomUUID()

      await database
        .characterHistoryEntry
        .create({
          data: {
            id: collisionId,
            characterId,
            title: 'Preexistente',
            description:
              'Entrada usada para forzar rollback.',
          },
        })

      await assert.rejects(
        repository.embrace({
          characterId,
          expectedRevision:
            created.revision,
          historyEntryId:
            collisionId,
        }),
      )

      const rolledBack =
        await repository
          .findByCharacterId(
            characterId,
          )

      assert.ok(rolledBack)
      assert.equal(
        rolledBack.nature,
        'human',
      )
      assert.equal(
        rolledBack.revision,
        created.revision,
      )
      assert.equal(
        rolledBack.humanity.value,
        6,
      )

      await database
        .characterHistoryEntry
        .delete({
          where: {
            id: collisionId,
          },
        })

      const embraced =
        await repository.embrace({
          characterId,
          expectedRevision:
            created.revision,
          historyEntryId:
            randomUUID(),
        })

      assert.equal(
        embraced.nature,
        'vampire',
      )
      assert.equal(
        embraced.creation.creationMode,
        'sessionZero',
      )
      assert.equal(
        embraced.revision,
        created.revision + 1,
      )
      assert.equal(
        embraced.humanity.value,
        6,
      )
      assert.equal(
        embraced.humanity.stains,
        1,
      )
      assert.equal(
        embraced.blood,
        null,
      )
      assert.equal(
        embraced.thinBloodAlchemy,
        null,
      )
      assert.equal(
        embraced.identity.clanKey,
        null,
      )
      assert.equal(
        embraced.identity.generation,
        null,
      )
      assert.deepEqual(
        embraced.disciplines,
        [],
      )

      const history =
        await database
          .characterHistoryEntry
          .findMany({
            where: {
              characterId,
            },
          })

      assert.equal(
        history.length,
        1,
      )
      assert.equal(
        history[0].title,
        'Abrazo',
      )
      assert.equal(
        history[0].description,
        'El personaje ha recibido el Abrazo.',
      )

      await assert.rejects(
        repository.embrace({
          characterId,
          expectedRevision:
            embraced.revision,
          historyEntryId:
            randomUUID(),
        }),
        CharacterEmbraceWriteConflictError,
      )

      assert.equal(
        await database
          .characterHistoryEntry
          .count({
            where: {
              characterId,
              title: 'Abrazo',
            },
          }),
        1,
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
