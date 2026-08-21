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
  ConsumeCharacterBloodDyscrasiaUseCase,
} from '../dist/characters/application/consume-character-blood-dyscrasia.use-case.js'

import {
  CharacterBloodDyscrasiaAlreadyConsumedError,
} from '../dist/characters/application/character-blood-dyscrasia-consumption.repository.js'

import {
  InvalidCharacterBloodDyscrasiaConsumptionError,
} from '../dist/characters/domain/character-blood-dyscrasia-consumption.types.js'

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

test('058-D3 consume una sola vez la instancia exacta sin borrar Resonancia', async () => {
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

  const consume =
    new ConsumeCharacterBloodDyscrasiaUseCase(
      repository,
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
          `spec058d3-${ownerId}`,
        displayName:
          'SPEC-058-D3 owner',
        passwordHash:
          'integration-test-only',
      },
    })

    const created =
      await repository.create({
        ownerId,
        chronicleId: null,
        identity: {
          name: 'Vampiro 058-D3',
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

    const sourceOperationId =
      randomUUID()

    const acquired =
      await apply.execute(
        ownerId,
        {
          characterId,
          expectedRevision:
            created.revision,
          operationId:
            sourceOperationId,
          sourceKind: 'human',
          resonanceKey: 'choleric',
          specialAffinityKey: null,
          temperament: 'acute',
          dyscrasiaKey: 'energetic',
          dyscrasiaAcquisitionMode:
            'drainAndKill',
          hungerSlaked: 1,
        },
      )

    assert.deepEqual(
      acquired.blood?.dyscrasia,
      {
        key: 'energetic',
        acquisitionMode:
          'drainAndKill',
      },
    )

    const active =
      await repository
        .findActiveBloodDyscrasia(
          characterId,
        )

    assert.deepEqual(
      active,
      {
        characterId,
        sourceBloodOperationId:
          sourceOperationId,
        dyscrasiaKey: 'energetic',
      },
    )

    const consumeOperationId =
      randomUUID()

    const consumed =
      await consume.execute(
        ownerId,
        {
          characterId,
          expectedRevision:
            acquired.revision,
          operationId:
            consumeOperationId,
          sourceBloodOperationId:
            sourceOperationId,
          dyscrasiaKey: 'energetic',
        },
      )

    assert.equal(
      consumed.blood?.dyscrasia ??
        null,
      null,
    )

    assert.equal(
      consumed.blood?.resonance
        ?.resonanceKey,
      'choleric',
    )

    assert.equal(
      consumed.blood?.resonance
        ?.temperament,
      'acute',
    )

    const ledger =
      await repository
        .findBloodDyscrasiaConsumptionOperation(
          characterId,
          consumeOperationId,
        )

    assert.equal(
      ledger?.sourceBloodOperationId,
      sourceOperationId,
    )
    assert.equal(
      ledger?.dyscrasiaKey,
      'energetic',
    )

    const feedHistory =
      await database
        .characterHistoryEntry
        .findUnique({
          where: {
            id: sourceOperationId,
          },
        })

    assert.equal(
      feedHistory?.title,
      'Alimentación y Resonancia',
    )
    assert.match(
      feedHistory?.description ?? '',
      /Discrasia/,
    )

    const consumeHistory =
      await database
        .characterHistoryEntry
        .findUnique({
          where: {
            id: consumeOperationId,
          },
        })

    assert.equal(
      consumeHistory?.title,
      'Discrasia consumida',
    )
    assert.match(
      consumeHistory?.description ?? '',
      /Enérgico|energetic/i,
    )

    const retry =
      await consume.execute(
        ownerId,
        {
          characterId,
          expectedRevision:
            acquired.revision,
          operationId:
            consumeOperationId,
          sourceBloodOperationId:
            sourceOperationId,
          dyscrasiaKey: 'energetic',
        },
      )

    assert.equal(
      retry.revision,
      consumed.revision,
    )

    assert.equal(
      await database
        .characterHistoryEntry
        .count({
          where: {
            id: consumeOperationId,
            characterId,
          },
        }),
      1,
    )

    await assert.rejects(
      consume.execute(
        ownerId,
        {
          characterId,
          expectedRevision:
            consumed.revision,
          operationId:
            randomUUID(),
          sourceBloodOperationId:
            sourceOperationId,
          dyscrasiaKey: 'energetic',
        },
      ),
      CharacterBloodDyscrasiaAlreadyConsumedError,
    )

    const aggressiveSource =
      randomUUID()

    const aggressive =
      await apply.execute(
        ownerId,
        {
          characterId,
          expectedRevision:
            consumed.revision,
          operationId:
            aggressiveSource,
          sourceKind: 'human',
          resonanceKey: 'choleric',
          specialAffinityKey: null,
          temperament: 'acute',
          dyscrasiaKey: 'aggressive',
          dyscrasiaAcquisitionMode:
            'feedThreeNights',
          hungerSlaked: 1,
        },
      )

    await assert.rejects(
      consume.execute(
        ownerId,
        {
          characterId,
          expectedRevision:
            aggressive.revision,
          operationId:
            randomUUID(),
          sourceBloodOperationId:
            aggressiveSource,
          dyscrasiaKey: 'aggressive',
        },
      ),
      InvalidCharacterBloodDyscrasiaConsumptionError,
    )

    const rows =
      await database
        .characterBloodDyscrasiaConsumptionOperation
        .findMany({
          where: {
            characterId,
          },
        })

    assert.equal(rows.length, 1)
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
