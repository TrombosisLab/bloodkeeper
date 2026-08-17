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
