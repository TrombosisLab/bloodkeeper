import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import test from 'node:test'

import {
  CharacterDraftWriteConflictError,
} from '../dist/characters/application/character-draft.repository.js'

import {
  CharacterChronicleAssociationNotFoundError,
  CharacterChronicleChangeConfirmationRequiredError,
  CharacterChronicleMembershipRequiredError,
  UpdateCharacterChronicleAssociationUseCase,
} from '../dist/characters/application/update-character-chronicle-association.use-case.js'

import {
  CharacterChronicleAssociationRequiredError,
  UpdateCharacterDraftUseCase,
} from '../dist/characters/application/update-character-draft.use-case.js'

function draft({
  ownerId = randomUUID(),
  characterId = randomUUID(),
  chronicleId = null,
  revision = 4,
} = {}) {
  return {
    characterId,
    ownerId,
    chronicleId,
    status: 'draft',
    revision,
    createdAt: new Date(),
    updatedAt: new Date(),
    identity: {},
    creation: {
      currentStep: 'identity',
      skillDistributionMethod:
        'balanced',
      predatorTypeChoices: {},
    },
    attributes: {},
    blood: {},
    damage: {},
    skills: {},
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
    advantages: [],
    humanity: {
      value: 7,
      stains: 0,
      convictions: [],
      touchstones: [],
    },
  }
}

function characterRepository(
  current,
  {
    hasHistory = false,
  } = {},
) {
  const calls = []

  return {
    calls,

    async findById(
      ownerId,
      characterId,
    ) {
      calls.push([
        'findById',
        ownerId,
        characterId,
      ])
      return current
    },

    async hasHistoryEntries(
      ownerId,
      characterId,
    ) {
      calls.push([
        'hasHistoryEntries',
        ownerId,
        characterId,
      ])
      return hasHistory
    },

    async updateChronicleAssociation(
      ownerId,
      data,
    ) {
      calls.push([
        'updateChronicleAssociation',
        ownerId,
        data,
      ])

      return {
        ...current,
        chronicleId:
          data.chronicleId,
        revision:
          data.expectedRevision + 1,
      }
    },

    async update() {
      throw new Error(
        'generic update should not be used by dedicated association',
      )
    },
  }
}

function participantRepository(
  membership = null,
) {
  return {
    async findActiveMembership() {
      return membership
    },
  }
}

test(
  '031-C primera asociación exige membresía activa del propietario',
  async () => {
    const ownerId = randomUUID()
    const current = draft({
      ownerId,
      chronicleId: null,
    })
    const chronicleId = randomUUID()

    await assert.rejects(
      new UpdateCharacterChronicleAssociationUseCase(
        characterRepository(current),
        participantRepository(null),
      ).execute(
        ownerId,
        {
          characterId:
            current.characterId,
          expectedRevision:
            current.revision,
          chronicleId,
          confirmChange: false,
        },
      ),
      CharacterChronicleMembershipRequiredError,
    )

    const result =
      await new UpdateCharacterChronicleAssociationUseCase(
        characterRepository(current),
        participantRepository({
          userId: ownerId,
          chronicleId,
          status: 'active',
          role: 'player',
        }),
      ).execute(
        ownerId,
        {
          characterId:
            current.characterId,
          expectedRevision:
            current.revision,
          chronicleId,
          confirmChange: false,
        },
      )

    assert.equal(
      result.chronicleId,
      chronicleId,
    )
    assert.equal(
      result.ownerId,
      ownerId,
    )
  },
)

test(
  '031-C cambio con historial exige confirmación explícita',
  async () => {
    const ownerId = randomUUID()
    const current = draft({
      ownerId,
      chronicleId: randomUUID(),
    })
    const nextChronicleId =
      randomUUID()

    const useCase =
      new UpdateCharacterChronicleAssociationUseCase(
        characterRepository(
          current,
          {
            hasHistory: true,
          },
        ),
        participantRepository({
          userId: ownerId,
          chronicleId:
            nextChronicleId,
          status: 'active',
          role: 'player',
        }),
      )

    await assert.rejects(
      useCase.execute(
        ownerId,
        {
          characterId:
            current.characterId,
          expectedRevision:
            current.revision,
          chronicleId:
            nextChronicleId,
          confirmChange: false,
        },
      ),
      CharacterChronicleChangeConfirmationRequiredError,
    )

    const result =
      await useCase.execute(
        ownerId,
        {
          characterId:
            current.characterId,
          expectedRevision:
            current.revision,
          chronicleId:
            nextChronicleId,
          confirmChange: true,
        },
      )

    assert.equal(
      result.chronicleId,
      nextChronicleId,
    )
  },
)

test(
  '031-C permite desasociar sin borrar personaje ni historial',
  async () => {
    const ownerId = randomUUID()
    const current = draft({
      ownerId,
      chronicleId: randomUUID(),
    })

    const result =
      await new UpdateCharacterChronicleAssociationUseCase(
        characterRepository(current),
        participantRepository(),
      ).execute(
        ownerId,
        {
          characterId:
            current.characterId,
          expectedRevision:
            current.revision,
          chronicleId: null,
          confirmChange: false,
        },
      )

    assert.equal(
      result.chronicleId,
      null,
    )
    assert.equal(
      result.ownerId,
      ownerId,
    )
  },
)

test(
  '031-C protege ausencia y revision concurrente',
  async () => {
    const ownerId = randomUUID()

    await assert.rejects(
      new UpdateCharacterChronicleAssociationUseCase(
        characterRepository(null),
        participantRepository(),
      ).execute(
        ownerId,
        {
          characterId: randomUUID(),
          expectedRevision: 1,
          chronicleId: null,
          confirmChange: false,
        },
      ),
      CharacterChronicleAssociationNotFoundError,
    )

    const current = draft({
      ownerId,
      revision: 5,
    })

    await assert.rejects(
      new UpdateCharacterChronicleAssociationUseCase(
        characterRepository(current),
        participantRepository(),
      ).execute(
        ownerId,
        {
          characterId:
            current.characterId,
          expectedRevision: 4,
          chronicleId: null,
          confirmChange: false,
        },
      ),
      CharacterDraftWriteConflictError,
    )
  },
)

test(
  '031-C PATCH genérico rechaza un cambio real de chronicleId',
  async () => {
    const ownerId = randomUUID()
    const current = draft({
      ownerId,
      chronicleId: randomUUID(),
    })

    await assert.rejects(
      new UpdateCharacterDraftUseCase(
        {
          async findById() {
            return current
          },
          async update() {
            throw new Error(
              'no debe escribir',
            )
          },
        },
      ).execute(
        ownerId,
        {
          characterId:
            current.characterId,
          expectedRevision:
            current.revision,
          chronicleId:
            randomUUID(),
        },
      ),
      CharacterChronicleAssociationRequiredError,
    )
  },
)
