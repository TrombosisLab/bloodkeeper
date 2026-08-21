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
  CharacterBloodResonanceOperationConflictError,
} from '../dist/characters/application/character-draft.repository.js'

import {
  UpdateCharacterStateUseCase,
} from '../dist/characters/application/update-character-state.use-case.js'

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

test('058-B persiste, reemplaza, deduplica y expira Resonancia', async () => {
  const database = new DatabaseService()
  const repository =
    new PrismaCharacterDraftRepository(database)
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
        username: `spec058b-${ownerId}`,
        displayName: 'SPEC-058-B owner',
        passwordHash: 'integration-test-only',
      },
    })

    const created = await repository.create({
      ownerId,
      chronicleId: null,
      identity: {
        name: 'Vampiro 058-B',
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
        hunger: 3,
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

    characterId = created.characterId

    const operationOne = randomUUID()

    const first = await apply.execute(
      ownerId,
      {
        characterId,
        expectedRevision:
          created.revision,
        operationId: operationOne,
        sourceKind: 'human',
        resonanceKey: 'choleric',
        specialAffinityKey: null,
        temperament: 'intense',
        hungerSlaked: 1,
      },
    )

    assert.equal(first.revision, created.revision + 1)
    assert.equal(first.blood?.hunger, 2)
    assert.deepEqual(
      first.blood?.resonance,
      {
        sourceKind: 'human',
        resonanceKey: 'choleric',
        specialAffinityKey: null,
        temperament: 'intense',
      },
    )

    const second = await apply.execute(
      ownerId,
      {
        characterId,
        expectedRevision:
          first.revision,
        operationId: randomUUID(),
        sourceKind: 'animal',
        resonanceKey: null,
        specialAffinityKey:
          'animalBlood',
        temperament: 'acute',
        hungerSlaked: 1,
      },
    )

    assert.equal(second.blood?.hunger, 1)
    assert.equal(
      second.blood?.resonance
        ?.specialAffinityKey,
      'animalBlood',
    )

    const oldRetry = await apply.execute(
      ownerId,
      {
        characterId,
        expectedRevision:
          created.revision,
        operationId: operationOne,
        sourceKind: 'human',
        resonanceKey: 'choleric',
        specialAffinityKey: null,
        temperament: 'intense',
        hungerSlaked: 1,
      },
    )

    assert.equal(oldRetry.revision, second.revision)
    assert.equal(oldRetry.blood?.hunger, 1)

    await assert.rejects(
      apply.execute(
        ownerId,
        {
          characterId,
          expectedRevision:
            second.revision,
          operationId: operationOne,
          sourceKind: 'human',
          resonanceKey: 'sanguine',
          specialAffinityKey: null,
          temperament: 'intense',
          hungerSlaked: 1,
        },
      ),
      CharacterBloodResonanceOperationConflictError,
    )

    const hungerFive =
      await updateState.execute(
        ownerId,
        {
          characterId,
          expectedRevision:
            second.revision,
          hunger: 5,
        },
      )

    assert.equal(hungerFive?.blood?.hunger, 5)
    assert.equal(
      hungerFive?.blood?.resonance,
      null,
    )

    const lowered =
      await updateState.execute(
        ownerId,
        {
          characterId,
          expectedRevision:
            hungerFive.revision,
          hunger: 3,
        },
      )

    const third = await apply.execute(
      ownerId,
      {
        characterId,
        expectedRevision:
          lowered.revision,
        operationId: randomUUID(),
        sourceKind: 'human',
        resonanceKey: 'sanguine',
        specialAffinityKey: null,
        temperament: 'intense',
        hungerSlaked: 1,
      },
    )

    assert.equal(third.blood?.hunger, 2)
    assert.notEqual(
      third.blood?.resonance,
      null,
    )

    const feedingViaState =
      await updateState.execute(
        ownerId,
        {
          characterId,
          expectedRevision:
            third.revision,
          hunger: 1,
        },
      )

    assert.equal(
      feedingViaState?.blood?.resonance,
      null,
    )

    const operationCount =
      await database
        .characterBloodResonanceOperation
        .count({
          where: { characterId },
        })

    assert.equal(operationCount, 3)

    const firstHistory =
      await database
        .characterHistoryEntry
        .findUnique({
          where: {
            id: operationOne,
          },
        })

    assert.equal(
      firstHistory?.characterId,
      characterId,
    )
    assert.equal(
      firstHistory?.title,
      'Alimentación y Resonancia',
    )
    assert.match(
      firstHistory?.description ?? '',
      /Colérica/,
    )

    assert.equal(
      await database
        .characterHistoryEntry
        .count({
          where: {
            id: operationOne,
            characterId,
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
})
