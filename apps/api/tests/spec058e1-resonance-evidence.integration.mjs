import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'

import {
  DatabaseService,
} from '../dist/database/database.service.js'

import {
  PrismaCharacterDraftRepository,
} from '../dist/characters/infrastructure/prisma-character-draft.repository.js'

import {
  ApplyCharacterBloodResonanceUseCase,
} from '../dist/characters/application/apply-character-blood-resonance.use-case.js'

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

test('058-E1 Prisma recupera evidencia histórica aunque la Resonancia activa sea reemplazada', async () => {
  const database = new DatabaseService()
  const repository =
    new PrismaCharacterDraftRepository(
      database,
    )

  const participants = {
    async findActiveMembership() {
      throw new Error(
        'No chronicle membership expected',
      )
    },
  }

  const apply =
    new ApplyCharacterBloodResonanceUseCase(
      repository,
      participants,
    )

  const ownerId = randomUUID()
  let characterId = null

  await database.$connect()

  try {
    await database.user.create({
      data: {
        id: ownerId,
        username:
          `spec058e1-${ownerId}`,
        displayName:
          'SPEC-058-E1 owner',
        passwordHash:
          'integration-test-only',
      },
    })

    const created =
      await repository.create({
        ownerId,
        chronicleId: null,
        identity: {
          name: 'Vampiro 058-E1',
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
          hunger: 4,
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
          currentStep: 'review',
          skillDistributionMethod:
            'balanced',
          predatorTypeChoices: {},
        },
      })

    characterId =
      created.characterId

    const cholericOperationId =
      randomUUID()

    const choleric =
      await apply.execute(
        ownerId,
        {
          characterId,
          expectedRevision:
            created.revision,
          operationId:
            cholericOperationId,
          sourceKind: 'human',
          resonanceKey: 'choleric',
          specialAffinityKey: null,
          temperament: 'fleeting',
          hungerSlaked: 1,
        },
      )

    const sanguineOperationId =
      randomUUID()

    await apply.execute(
      ownerId,
      {
        characterId,
        expectedRevision:
          choleric.revision,
        operationId:
          sanguineOperationId,
        sourceKind: 'human',
        resonanceKey: 'sanguine',
        specialAffinityKey: null,
        temperament: 'intense',
        hungerSlaked: 1,
      },
    )

    const operations =
      await repository
        .listBloodResonanceOperations(
          characterId,
        )

    assert.equal(
      operations.length,
      2,
    )

    const cholericEvidence =
      operations.find(
        ({ operationId }) =>
          operationId ===
          cholericOperationId,
      )

    assert.equal(
      cholericEvidence?.resonanceKey,
      'choleric',
    )
    assert.equal(
      cholericEvidence?.temperament,
      'fleeting',
    )

    const sanguineEvidence =
      operations.find(
        ({ operationId }) =>
          operationId ===
          sanguineOperationId,
      )

    assert.equal(
      sanguineEvidence?.resonanceKey,
      'sanguine',
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
})
