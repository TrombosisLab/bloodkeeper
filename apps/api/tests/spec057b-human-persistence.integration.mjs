import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'

import {
  CharacterCreationMode,
  CharacterNature,
} from '@prisma/client'

import {
  DatabaseService,
} from '../dist/database/database.service.js'

import {
  PrismaCharacterDraftRepository,
} from '../dist/characters/infrastructure/prisma-character-draft.repository.js'

import {
  CHARACTER_SKILL_KEYS,
} from '../dist/characters/domain/persisted-character.types.js'

function skills() {
  return Object.fromEntries(
    CHARACTER_SKILL_KEYS.map(
      (key) => [key, 0],
    ),
  )
}

test(
  'SPEC-057-B Prisma representa HUMAN sin BloodState ni ThinBloodAlchemyState',
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
            `spec057b-${ownerId}`,
          displayName:
            'SPEC-057-B owner',
          passwordHash:
            'integration-test-only',
        },
      })

      const created =
        await repository.create({
          ownerId,
          chronicleId: null,
          identity: {
            name: 'Humana 057-B',
            concept: 'Periodista',
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
          skills: skills(),
          skillSpecialties: [],
          disciplines: [],
          bloodSorceryRituals: {
            ritualKeys: [],
          },
          oblivionCeremonies: {
            ceremonyKeys: [],
          },
          thinBloodAlchemy: {
            rating: 0,
            method: null,
            formulaKeys: [],
          },
          thinBloodTraits: [],
          advantages: {
            selections: [],
          },
          humanity: {
            value: 7,
            stains: 0,
            convictions: [],
            touchstones: [],
          },
          creation: {
            currentStep: 'identity',
            skillDistributionMethod:
              'balanced',
            predatorTypeChoices: {},
          },
        })

      characterId =
        created.characterId

      await database.$transaction(
        async (tx) => {
          await tx.character.update({
            where: {
              id: characterId,
            },
            data: {
              nature:
                CharacterNature.HUMAN,
            },
          })

          await tx.characterCreationState.update({
            where: {
              characterId,
            },
            data: {
              creationMode:
                CharacterCreationMode
                  .SESSION_ZERO,
            },
          })

          await tx.characterBloodState.delete({
            where: {
              characterId,
            },
          })

          await tx.characterThinBloodAlchemyState.delete({
            where: {
              characterId,
            },
          })
        },
      )

      const loaded =
        await repository.findById(
          ownerId,
          characterId,
        )

      assert.ok(loaded)
      assert.equal(
        loaded.nature,
        'human',
      )
      assert.equal(
        loaded.creation.creationMode,
        'sessionZero',
      )
      assert.equal(
        loaded.blood,
        null,
      )
      assert.equal(
        loaded.thinBloodAlchemy,
        null,
      )

      const raw =
        await database.character.findUnique({
          where: {
            id: characterId,
          },
          include: {
            blood: true,
            thinBloodAlchemy: true,
          },
        })

      assert.equal(raw?.blood, null)
      assert.equal(
        raw?.thinBloodAlchemy,
        null,
      )
    } finally {
      if (characterId !== null) {
        await database.character.delete({
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
