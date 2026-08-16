import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import test from 'node:test'

import {DatabaseService}
  from '../dist/database/database.service.js'
import {PrismaCharacterDraftRepository}
  from '../dist/characters/infrastructure/prisma-character-draft.repository.js'
import {CHARACTER_SKILL_KEYS}
  from '../dist/characters/domain/persisted-character.types.js'

test('057-C1 persiste HUMAN sin filas vampíricas', async () => {
  const database = new DatabaseService()
  const repository =
    new PrismaCharacterDraftRepository(database)
  const ownerId = randomUUID()
  let characterId = null

  await database.$connect()

  try {
    await database.user.create({
      data: {
        id: ownerId,
        username: `spec057c1-${ownerId}`,
        displayName: 'SPEC-057-C1 owner',
        passwordHash: 'integration-test-only',
      },
    })

    const created =
      await repository.create({
        ownerId,
        chronicleId: null,
        identity: {
          name: 'Humano C1',
          concept: 'Investigador mortal',
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
          CHARACTER_SKILL_KEYS.map(key => [key, 0]),
        ),
        skillSpecialties: [],
        disciplines: [],
        bloodSorceryRituals: {ritualKeys: []},
        oblivionCeremonies: {ceremonyKeys: []},
        thinBloodAlchemy: null,
        thinBloodTraits: [],
        advantages: {selections: []},
        humanity: {
          value: 7,
          stains: 0,
          convictions: [],
          touchstones: [],
        },
        creation: {
          creationMode: 'sessionZero',
          currentStep: 'identity',
          skillDistributionMethod: 'balanced',
          predatorTypeChoices: {},
        },
      })

    characterId = created.characterId

    assert.equal(created.nature, 'human')
    assert.equal(
      created.creation.creationMode,
      'sessionZero',
    )
    assert.equal(created.blood, null)
    assert.equal(created.thinBloodAlchemy, null)

    const loaded =
      await repository.findById(ownerId, characterId)

    assert.equal(loaded?.nature, 'human')
    assert.equal(loaded?.blood, null)
    assert.equal(loaded?.thinBloodAlchemy, null)

    const blood =
      await database.characterBloodState.findUnique({
        where: {characterId},
      })
    const alchemy =
      await database.characterThinBloodAlchemyState.findUnique({
        where: {characterId},
      })

    assert.equal(blood, null)
    assert.equal(alchemy, null)
  } finally {
    if (characterId !== null) {
      await database.character.delete({
        where: {id: characterId},
      })
    }
    await database.user.deleteMany({
      where: {id: ownerId},
    })
    await database.$disconnect()
  }
})
