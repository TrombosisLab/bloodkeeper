import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CharacterDisciplinePowerRouseCheckUnavailableError,
  ExecuteCharacterDisciplinePowerRouseCheckUseCase,
} from '../dist/characters/application/execute-character-discipline-power-rouse-check.use-case.js'

const readyProfile = {
  powerKey: 'celerity-fleetness',
  powerName: 'Presteza',
  disciplineKey: 'celerity',
  level: 2,
  status: 'ready',
  execution: 'singleCheck',
  rouseCost: { kind: 'fixed', checks: 1 },
  requiredChecks: 1,
  dicePerCheck: 2,
  exemptions: [],
}

test(
  'el lanzador contextual resuelve el poder desde la capa normalizada',
  async () => {
    const calls = []
    const useCase =
      new ExecuteCharacterDisciplinePowerRouseCheckUseCase(
        {
          async execute() {
            return {
              characterId: 'character-1',
              characterRevision: 7,
              bloodPotency: 3,
              profiles: [readyProfile],
            }
          },
        },
        {
          async execute(actorId, command) {
            calls.push({ actorId, command })
            return { rollHistoryId: 'history-1' }
          },
        },
      )

    await useCase.execute('user-1', {
      characterId: 'character-1',
      expectedRevision: 7,
      operationId: 'operation-1',
      powerKey: 'celerity-fleetness',
    })

    assert.deepEqual(calls, [
      {
        actorId: 'user-1',
        command: {
          characterId: 'character-1',
          expectedRevision: 7,
          operationId: 'operation-1',
          reason: 'disciplinePower',
          disciplinePowerLevel: 2,
        },
      },
    ])
  },
)

test(
  'el lanzador no convierte un coste contextual en un único Control',
  async () => {
    const useCase =
      new ExecuteCharacterDisciplinePowerRouseCheckUseCase(
        {
          async execute() {
            return {
              characterId: 'character-1',
              characterRevision: 7,
              bloodPotency: 3,
              profiles: [
                {
                  ...readyProfile,
                  status: 'contextual',
                  execution: 'contextual',
                  requiredChecks: 2,
                },
              ],
            }
          },
        },
        {
          async execute() {
            throw new Error('no debe ejecutar el Control')
          },
        },
      )

    await assert.rejects(
      useCase.execute('user-1', {
        characterId: 'character-1',
        expectedRevision: 7,
        operationId: 'operation-1',
        powerKey: 'celerity-fleetness',
      }),
      (error) => {
        assert.equal(
          error instanceof
            CharacterDisciplinePowerRouseCheckUnavailableError,
          true,
        )
        assert.equal(error.status, 'contextual')
        return true
      },
    )
  },
)

