import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ValidateCharacterUseCase,
} from '../dist/characters/application/validate-character.use-case.js'

const ownerId =
  '3bbc46f8-a45f-4589-9872-129e6652082c'
const characterId =
  '39c1801e-68fe-4c92-8795-723cac284bdf'

test(
  '029-D valida solo el personaje accesible por su propietario',
  async () => {
    const character = { characterId }
    const report = {
      context: 'activation',
      valid: false,
      canProceed: false,
      sections: [],
      issues: [],
    }
    const calls = []
    const useCase = new ValidateCharacterUseCase(
      {
        async findById(owner, id) {
          calls.push(['findById', owner, id])
          return character
        },
      },
      {
        validate(input, context) {
          calls.push(['validate', input, context])
          return report
        },
      },
    )

    assert.equal(
      await useCase.execute(
        ownerId,
        characterId,
        'activation',
      ),
      report,
    )
    assert.deepEqual(calls, [
      ['findById', ownerId, characterId],
      ['validate', character, 'activation'],
    ])
  },
)

test(
  '029-D no valida ni revela personajes ausentes o ajenos',
  async () => {
    let validations = 0
    const useCase = new ValidateCharacterUseCase(
      {
        async findById() {
          return null
        },
      },
      {
        validate() {
          validations += 1
        },
      },
    )

    assert.equal(
      await useCase.execute(
        ownerId,
        characterId,
        'play',
      ),
      null,
    )
    assert.equal(validations, 0)
  },
)
