import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CharacterProfilePhaseUnavailableError,
  LoadCharacterProfilePhaseUseCase,
} from '../dist/characters/application/load-character-profile-phase.use-case.js'

function character(
  nature,
  creationMode,
) {
  return {
    characterId:
      '11111111-1111-4111-8111-111111111111',
    nature,
    creation: {
      creationMode,
    },
  }
}

function repository(value) {
  return {
    async findById(
      ownerId,
      characterId,
    ) {
      assert.equal(
        ownerId,
        '22222222-2222-4222-8222-222222222222',
      )
      assert.equal(
        characterId,
        '11111111-1111-4111-8111-111111111111',
      )
      return value
    },
  }
}

function validator(valid) {
  return {
    validate(value, context) {
      assert.equal(
        context,
        'activation',
      )
      assert.equal(
        value.nature,
        'vampire',
      )
      return {
        valid,
        canProceed: valid,
        sections: [],
        issues: [],
      }
    },
  }
}

test(
  '057-F2A1 deriva HUMAN sin fabricar estado vampírico',
  async () => {
    const useCase =
      new LoadCharacterProfilePhaseUseCase(
        repository(
          character(
            'human',
            'sessionZero',
          ),
        ),
        {
          validate() {
            throw new Error(
              'human must not require vampire validation',
            )
          },
        },
      )

    assert.equal(
      await useCase.execute(
        '22222222-2222-4222-8222-222222222222',
        '11111111-1111-4111-8111-111111111111',
      ),
      'HUMAN',
    )
  },
)

test(
  '057-F2A1 deriva vampiro transitorio desde validación canónica',
  async () => {
    const useCase =
      new LoadCharacterProfilePhaseUseCase(
        repository(
          character(
            'vampire',
            'sessionZero',
          ),
        ),
        validator(false),
      )

    assert.equal(
      await useCase.execute(
        '22222222-2222-4222-8222-222222222222',
        '11111111-1111-4111-8111-111111111111',
      ),
      'TRANSITIONAL_VAMPIRE',
    )
  },
)

test(
  '057-F2A1 deriva vampiro establecido desde validación canónica',
  async () => {
    const useCase =
      new LoadCharacterProfilePhaseUseCase(
        repository(
          character(
            'vampire',
            'sessionZero',
          ),
        ),
        validator(true),
      )

    assert.equal(
      await useCase.execute(
        '22222222-2222-4222-8222-222222222222',
        '11111111-1111-4111-8111-111111111111',
      ),
      'ESTABLISHED_VAMPIRE',
    )
  },
)

test(
  '057-F2A1 no reclasifica un draft estándar inválido',
  async () => {
    const useCase =
      new LoadCharacterProfilePhaseUseCase(
        repository(
          character(
            'vampire',
            'standard',
          ),
        ),
        validator(false),
      )

    await assert.rejects(
      useCase.execute(
        '22222222-2222-4222-8222-222222222222',
        '11111111-1111-4111-8111-111111111111',
      ),
      CharacterProfilePhaseUnavailableError,
    )
  },
)

test(
  '057-F2A1 conserva null para personaje inexistente o ajeno',
  async () => {
    const useCase =
      new LoadCharacterProfilePhaseUseCase(
        repository(null),
        validator(true),
      )

    assert.equal(
      await useCase.execute(
        '22222222-2222-4222-8222-222222222222',
        '11111111-1111-4111-8111-111111111111',
      ),
      null,
    )
  },
)

test(
  '057-F2A3B2B2A read expone pendientes canónicos sólo durante transición',
  async () => {
    const transitionalCharacter = {
      characterId:
        '11111111-1111-4111-8111-111111111111',
      ownerId:
        '22222222-2222-4222-8222-222222222222',
      chronicleId: null,
      status: 'active',
      nature: 'vampire',
      revision: 4,
      createdAt:
        new Date('2026-08-17T10:00:00.000Z'),
      updatedAt:
        new Date('2026-08-17T11:00:00.000Z'),
      identity: {
        name: 'Alicia',
        concept: null,
        predatorTypeKey: null,
        ambition: null,
        clanKey: null,
        sire: null,
        desire: null,
        generation: null,
        ageCategory: null,
      },
      creation: {
        schemaVersion: 1,
        currentStep: 'review',
        creationMode: 'sessionZero',
        skillDistributionMethod: 'balanced',
        predatorTypeChoices: {},
        updatedAt:
          new Date('2026-08-17T11:00:00.000Z'),
      },
      attributes: {},
      blood: null,
      damage: {
        health: {
          superficial: 0,
          aggravated: 0,
        },
        willpower: {
          superficial: 0,
          aggravated: 0,
        },
      },
      skills: {},
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
        value: 7,
        stains: 0,
        convictions: [],
        touchstones: [],
      },
    }

    const useCase =
      new LoadCharacterProfilePhaseUseCase(
        {
          async findById(
            receivedOwnerId,
            receivedCharacterId,
          ) {
            assert.equal(
              receivedOwnerId,
              transitionalCharacter.ownerId,
            )
            assert.equal(
              receivedCharacterId,
              transitionalCharacter.characterId,
            )

            return transitionalCharacter
          },
        },
        {
          validate() {
            return {
              valid: false,
              canProceed: true,
              sections: [],
              issues: [],
            }
          },
        },
      )

    const result =
      await useCase.read(
        transitionalCharacter.ownerId,
        transitionalCharacter.characterId,
      )

    assert.equal(
      result?.phase,
      'TRANSITIONAL_VAMPIRE',
    )

    assert.deepEqual(
      result?.pendingDecisions,
      [
        'clan',
        'generation',
        'sire',
        'bloodState',
        'predatorType',
        'initialDisciplines',
        'initialPowers',
        'advantagesReview',
      ],
    )
  },
)
