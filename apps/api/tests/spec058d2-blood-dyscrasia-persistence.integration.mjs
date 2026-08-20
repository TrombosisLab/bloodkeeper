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
  UpdateCharacterStateUseCase,
} from '../dist/characters/application/update-character-state.use-case.js'

import {
  InvalidCharacterBloodResonanceError,
} from '../dist/characters/domain/character-blood-resonance.types.js'

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

test('058-D2 persiste, reemplaza, deduplica y expira Discrasia activa', async () => {
  const database = new DatabaseService()
  const repository =
    new PrismaCharacterDraftRepository(
      database,
    )

  const apply =
    new ApplyCharacterBloodResonanceUseCase(
      repository,
      {
        async findActiveMembership() {
          throw new Error(
            'No chronicle membership expected',
          )
        },
      },
    )

  const updateState =
    new UpdateCharacterStateUseCase(
      repository,
    )

  const ownerId = randomUUID()
  let characterId = null

  await database.$connect()

  try {
    await database.user.create({
      data: {
        id: ownerId,
        username:
          `spec058d2-${ownerId}`,
        displayName:
          'SPEC-058-D2 owner',
        passwordHash:
          'integration-test-only',
      },
    })

    const created =
      await repository.create({
        ownerId,
        chronicleId: null,
        identity: {
          name: 'Vampiro 058-D2',
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

    const operationOne =
      randomUUID()

    const first =
      await apply.execute(
        ownerId,
        {
          characterId,
          expectedRevision:
            created.revision,
          operationId:
            operationOne,
          sourceKind: 'human',
          resonanceKey: 'choleric',
          specialAffinityKey: null,
          temperament: 'acute',
          dyscrasiaKey: 'aggressive',
          dyscrasiaAcquisitionMode:
            'drainAndKill',
          hungerSlaked: 1,
        },
      )

    assert.equal(
      first.blood?.hunger,
      3,
    )
    assert.deepEqual(
      first.blood?.dyscrasia,
      {
        key: 'aggressive',
        acquisitionMode:
          'drainAndKill',
      },
    )

    const operation =
      await repository
        .findBloodResonanceOperation(
          characterId,
          operationOne,
        )

    assert.equal(
      operation?.dyscrasiaKey,
      'aggressive',
    )
    assert.equal(
      operation?.dyscrasiaAcquisitionMode,
      'drainAndKill',
    )

    const retry =
      await apply.execute(
        ownerId,
        {
          characterId,
          expectedRevision:
            created.revision,
          operationId:
            operationOne,
          sourceKind: 'human',
          resonanceKey: 'choleric',
          specialAffinityKey: null,
          temperament: 'acute',
          dyscrasiaKey: 'aggressive',
          dyscrasiaAcquisitionMode:
            'drainAndKill',
          hungerSlaked: 1,
        },
      )

    assert.equal(
      retry.revision,
      first.revision,
    )
    assert.deepEqual(
      retry.blood?.dyscrasia,
      first.blood?.dyscrasia,
    )

    const second =
      await apply.execute(
        ownerId,
        {
          characterId,
          expectedRevision:
            first.revision,
          operationId:
            randomUUID(),
          sourceKind: 'human',
          resonanceKey: 'sanguine',
          specialAffinityKey: null,
          temperament: 'intense',
          hungerSlaked: 1,
        },
      )

    assert.equal(
      second.blood?.hunger,
      2,
    )
    assert.equal(
      second.blood?.dyscrasia ?? null,
      null,
    )

    await assert.rejects(
      apply.execute(
        ownerId,
        {
          characterId,
          expectedRevision:
            second.revision,
          operationId:
            randomUUID(),
          sourceKind: 'human',
          resonanceKey: 'sanguine',
          specialAffinityKey: null,
          temperament: 'acute',
          dyscrasiaKey:
            'aggressive',
          dyscrasiaAcquisitionMode:
            'feedThreeNights',
          hungerSlaked: 1,
        },
      ),
      InvalidCharacterBloodResonanceError,
    )

    const third =
      await apply.execute(
        ownerId,
        {
          characterId,
          expectedRevision:
            second.revision,
          operationId:
            randomUUID(),
          sourceKind: 'human',
          resonanceKey: 'sanguine',
          specialAffinityKey: null,
          temperament: 'acute',
          dyscrasiaKey:
            'sniffingGame',
          dyscrasiaAcquisitionMode:
            'feedThreeNights',
          hungerSlaked: 1,
        },
      )

    assert.deepEqual(
      third.blood?.dyscrasia,
      {
        key: 'sniffingGame',
        acquisitionMode:
          'feedThreeNights',
      },
    )

    const hungerFive =
      await updateState.execute(
        ownerId,
        {
          characterId,
          expectedRevision:
            third.revision,
          hunger: 5,
        },
      )

    assert.equal(
      hungerFive.blood?.resonance,
      null,
    )
    assert.equal(
      hungerFive.blood?.dyscrasia ??
        null,
      null,
    )

    const operationRows =
      await database
        .characterBloodResonanceOperation
        .findMany({
          where: {
            characterId,
          },
          orderBy: {
            createdAt: 'asc',
          },
        })

    assert.equal(
      operationRows.length,
      3,
    )

    assert.equal(
      operationRows[0]
        .dyscrasiaKey,
      'AGGRESSIVE',
    )

    assert.equal(
      operationRows[1]
        .dyscrasiaKey,
      null,
    )

    assert.equal(
      operationRows[2]
        .dyscrasiaKey,
      'SNIFFING_GAME',
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
