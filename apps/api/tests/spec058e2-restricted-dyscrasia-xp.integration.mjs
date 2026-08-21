import assert from 'node:assert/strict'
import {
  randomUUID,
} from 'node:crypto'
import test from 'node:test'

import {
  DatabaseService,
} from '../dist/database/database.service.js'

import {
  PrismaCharacterDraftRepository,
} from '../dist/characters/infrastructure/prisma-character-draft.repository.js'

import {
  PrismaCharacterExperienceRepository,
} from '../dist/characters/infrastructure/prisma-character-experience.repository.js'

import {
  ApplyCharacterBloodResonanceUseCase,
} from '../dist/characters/application/apply-character-blood-resonance.use-case.js'

import {
  CharacterExperienceDuplicateError,
} from '../dist/characters/application/character-experience.repository.js'

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

test('058-E2 compra Disciplina por 14 en vez de 15 y consume exactamente una vez la Discrasia', async () => {
  const database =
    new DatabaseService()

  const drafts =
    new PrismaCharacterDraftRepository(
      database,
    )

  const experience =
    new PrismaCharacterExperienceRepository(
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
      drafts,
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
          `spec058e2-${ownerId}`,
        displayName:
          'SPEC-058-E2 owner',
        passwordHash:
          'integration-test-only',
      },
    })

    const created =
      await drafts.create({
        ownerId,
        chronicleId: null,
        identity: {
          name: 'Vampiro 058-E2',
          clanKey: 'brujah',
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
          dyscrasiaKey:
            'energetic',
          dyscrasiaAcquisitionMode:
            'drainAndKill',
          hungerSlaked: 1,
        },
      )

    await database
      .characterExperienceMovement
      .create({
        data: {
          characterId,
          actorId: ownerId,
          type: 'GRANT',
          component: 'EARNED',
          amount: 14,
          reason:
            'spec058e2_fixture',
        },
      })

    const purchaseOperationId =
      randomUUID()

    const purchaseData = {
      characterId,
      actorId: ownerId,
      expectedRevision:
        acquired.revision,
      operationId:
        purchaseOperationId,
      cost: 14,
      acquisitionType:
        'discipline',
      acquisitionKey:
        'celerity:celerity-rapid-reflexes',
      mutation: {
        kind: 'discipline',
        disciplineKey: 'celerity',
        powerKey:
          'celerity-rapid-reflexes',
      },
      dyscrasiaExperienceBenefit: {
        dyscrasiaKey:
          'energetic',
        disciplineKey:
          'celerity',
        amount: 1,
      },
    }

    const ledger =
      await experience.purchase(
        purchaseData,
      )

    assert.equal(
      ledger.total,
      14,
    )
    assert.equal(
      ledger.spent,
      14,
    )
    assert.equal(
      ledger.available,
      0,
    )

    const spend =
      await database
        .characterExperienceMovement
        .findFirst({
          where: {
            characterId,
            deduplicationKey:
              `spend:operation:${purchaseOperationId}`,
          },
        })

    assert.equal(
      spend?.type,
      'SPEND',
    )
    assert.equal(
      spend?.component,
      'SPENT',
    )
    assert.equal(
      spend?.amount,
      14,
    )
    assert.equal(
      spend?.reason,
      'advancement_purchase_dyscrasia',
    )

    const xpGrantCount =
      await database
        .characterExperienceMovement
        .count({
          where: {
            characterId,
            type: 'GRANT',
          },
        })

    assert.equal(
      xpGrantCount,
      1,
      'Sólo debe existir el GRANT fixture de 14; E2 no crea +1 fungible',
    )

    const blood =
      await database
        .characterBloodState
        .findUnique({
          where: {
            characterId,
          },
        })

    assert.equal(
      blood?.dyscrasiaKey,
      null,
    )
    assert.equal(
      blood
        ?.dyscrasiaAcquisitionMode,
      null,
    )
    assert.equal(
      blood
        ?.dyscrasiaSourceOperationId,
      null,
    )

    assert.equal(
      blood?.resonanceKey,
      'CHOLERIC',
    )
    assert.equal(
      blood
        ?.resonanceTemperament,
      'ACUTE',
    )

    const consumption =
      await database
        .characterBloodDyscrasiaConsumptionOperation
        .findUnique({
          where: {
            characterId_operationId: {
              characterId,
              operationId:
                purchaseOperationId,
            },
          },
        })

    assert.equal(
      consumption
        ?.sourceBloodOperationId,
      sourceOperationId,
    )
    assert.equal(
      consumption?.dyscrasiaKey,
      'ENERGETIC',
    )

    const disciplineRow =
      await database
        .characterDiscipline
        .findUnique({
          where: {
            characterId_disciplineKey_contributionKey: {
              characterId,
              disciplineKey:
                'celerity',
              contributionKey:
                'evolution',
            },
          },
        })

    assert.equal(
      disciplineRow?.rating,
      1,
    )

    const revised =
      await database.character
        .findUnique({
          where: {
            id: characterId,
          },
          select: {
            revision: true,
          },
        })

    assert.equal(
      revised?.revision,
      acquired.revision + 1,
    )

    await assert.rejects(
      experience.purchase(
        purchaseData,
      ),
      CharacterExperienceDuplicateError,
    )

    assert.equal(
      await database
        .characterExperienceMovement
        .count({
          where: {
            characterId,
            deduplicationKey:
              `spend:operation:${purchaseOperationId}`,
          },
        }),
      1,
    )

    assert.equal(
      await database
        .characterBloodDyscrasiaConsumptionOperation
        .count({
          where: {
            characterId,
            sourceBloodOperationId:
              sourceOperationId,
          },
        }),
      1,
    )

    const purchaseHistory =
      await database
        .characterHistoryEntry
        .findUnique({
          where: {
            id:
              purchaseOperationId,
          },
        })

    assert.equal(
      purchaseHistory?.characterId,
      characterId,
    )
    assert.equal(
      purchaseHistory?.title,
      'Discrasia consumida',
    )
    assert.match(
      purchaseHistory?.description ?? '',
      /adquisición de/i,
    )

    assert.equal(
      await database
        .characterHistoryEntry
        .count({
          where: {
            id:
              purchaseOperationId,
            characterId,
          },
        }),
      1,
    )
  } finally {
    // Esta integración usa PostgreSQL temporal y descartable.
    // El ledger de Experiencia es append-only e inmutable:
    // el cleanup correcto es desconectar y destruir el contenedor.
    await database.$disconnect()
  }
})
