import assert from 'node:assert/strict'
import test from 'node:test'

import {
  UpdateCharacterStateUseCase,
} from '../dist/characters/application/update-character-state.use-case.js'

import {
  InvalidCharacterStateUpdateError,
} from '../dist/characters/domain/character-state.rules.js'

import {
  toCharacterStateResponse,
} from '../dist/characters/presentation/character-state.dto.js'

const ownerId =
  '22222222-2222-4222-8222-222222222222'

const characterId =
  '11111111-1111-4111-8111-111111111111'

function baseCharacter({
  nature = 'human',
  blood = null,
} = {}) {
  return {
    characterId,
    revision: 4,
    status: 'active',
    nature,
    attributes: {
      stamina: 2,
      composure: 2,
      resolve: 2,
    },
    blood,
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
    humanity: {
      value: 7,
      stains: 0,
    },
  }
}

test(
  '057-F2A2A serializa HUMAN sin exigir ni fabricar Hambre',
  () => {
    const response =
      toCharacterStateResponse(
        baseCharacter(),
      )

    assert.equal(
      response.hunger,
      null,
    )

    assert.deepEqual(
      response.humanity,
      {
        value: 7,
        stains: 0,
      },
    )
  },
)

test(
  '057-F2A2A vampiro transitorio sin Blood expone Hambre ausente',
  () => {
    const response =
      toCharacterStateResponse(
        baseCharacter({
          nature: 'vampire',
          blood: null,
        }),
      )

    assert.equal(
      response.hunger,
      null,
    )
  },
)

test(
  '057-F2A2A vampiro con Blood conserva Hambre real',
  () => {
    const response =
      toCharacterStateResponse(
        baseCharacter({
          nature: 'vampire',
          blood: {
            bloodPotency: 2,
            hunger: 3,
          },
        }),
      )

    assert.equal(
      response.hunger,
      3,
    )
  },
)

test(
  '057-F2A2A humano puede actualizar Humanidad sin estado vampírico',
  async () => {
    const current =
      baseCharacter()

    let written = null

    const useCase =
      new UpdateCharacterStateUseCase({
        async findById(
          receivedOwnerId,
          receivedCharacterId,
        ) {
          assert.equal(
            receivedOwnerId,
            ownerId,
          )
          assert.equal(
            receivedCharacterId,
            characterId,
          )
          return current
        },

        async updateState(
          receivedOwnerId,
          data,
        ) {
          written = {
            ownerId:
              receivedOwnerId,
            data,
          }

          return {
            ...current,
            revision: 5,
            humanity: {
              value:
                data.humanityValue ??
                current.humanity.value,
              stains:
                data.humanityStains ??
                current.humanity.stains,
            },
          }
        },
      })

    const saved =
      await useCase.execute(
        ownerId,
        {
          characterId,
          expectedRevision: 4,
          humanityValue: 6,
        },
      )

    assert.equal(
      saved?.humanity.value,
      6,
    )
    assert.equal(
      written?.ownerId,
      ownerId,
    )
    assert.equal(
      written?.data.hunger,
      undefined,
    )
  },
)

test(
  '057-F2A2A humano no puede escribir Hambre',
  async () => {
    const current =
      baseCharacter()

    let writes = 0

    const useCase =
      new UpdateCharacterStateUseCase({
        async findById() {
          return current
        },

        async updateState() {
          writes += 1
          return current
        },
      })

    await assert.rejects(
      useCase.execute(
        ownerId,
        {
          characterId,
          expectedRevision: 4,
          hunger: 1,
        },
      ),
      (error) => {
        assert.ok(
          error instanceof
            InvalidCharacterStateUpdateError,
        )

        assert.deepEqual(
          error.violations,
          [
            'CHARACTER_HUNGER_NOT_AVAILABLE',
          ],
        )

        return true
      },
    )

    assert.equal(writes, 0)
  },
)

test(
  '057-F2A2A vampiro transitorio tampoco inventa Hambre antes de Blood',
  async () => {
    const current =
      baseCharacter({
        nature: 'vampire',
        blood: null,
      })

    let writes = 0

    const useCase =
      new UpdateCharacterStateUseCase({
        async findById() {
          return current
        },

        async updateState() {
          writes += 1
          return current
        },
      })

    await assert.rejects(
      useCase.execute(
        ownerId,
        {
          characterId,
          expectedRevision: 4,
          hunger: 0,
        },
      ),
      (error) => {
        assert.ok(
          error instanceof
            InvalidCharacterStateUpdateError,
        )

        assert.deepEqual(
          error.violations,
          [
            'CHARACTER_HUNGER_NOT_AVAILABLE',
          ],
        )

        return true
      },
    )

    assert.equal(writes, 0)
  },
)

test(
  '057-F2A2A conserva snapshots vampíricos legacy con Blood y nature omitida',
  () => {
    const legacy = {
      ...baseCharacter({
        nature: 'vampire',
        blood: {
          bloodPotency: 2,
          hunger: 4,
        },
      }),
    }

    delete legacy.nature

    assert.equal(
      toCharacterStateResponse(
        legacy,
      ).hunger,
      4,
    )
  },
)

test(
  '057-F2A2A conserva escritura legacy de Hambre cuando Blood existe',
  async () => {
    const current = {
      ...baseCharacter({
        nature: 'vampire',
        blood: {
          bloodPotency: 2,
          hunger: 2,
        },
      }),
    }

    delete current.nature

    let written = null

    const useCase =
      new UpdateCharacterStateUseCase({
        async findById() {
          return current
        },

        async updateState(
          _receivedOwnerId,
          data,
        ) {
          written = data

          return {
            ...current,
            revision: 5,
            blood: {
              ...current.blood,
              hunger:
                data.hunger ??
                current.blood.hunger,
            },
          }
        },
      })

    const saved =
      await useCase.execute(
        ownerId,
        {
          characterId,
          expectedRevision: 4,
          hunger: 3,
        },
      )

    assert.equal(
      written?.hunger,
      3,
    )
    assert.equal(
      saved?.blood.hunger,
      3,
    )
  },
)
