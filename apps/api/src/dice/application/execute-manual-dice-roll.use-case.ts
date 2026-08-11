import type {
  DiceRandomSource,
} from './dice-random-source'

import {
  executeDicePool,
} from './dice-execution'

import type {
  ExecutedDiceRoll,
} from './dice-execution'

import {
  buildDicePool,
} from '../domain/dice-pool.rules'

export interface ExecuteManualDiceRollCommand {
  readonly pool: number
  readonly hunger: number
  readonly modifier?: number
  readonly difficulty?: number | null
}

export class ExecuteManualDiceRollUseCase {
  constructor(
    private readonly random: DiceRandomSource,
  ) {}

  execute(
    command: ExecuteManualDiceRollCommand,
  ): ExecutedDiceRoll {
    const pool = buildDicePool({
      components: [{
        key: 'manual_pool',
        label: 'Reserva manual',
        value: command.pool,
      }],
      modifier: command.modifier,
      hunger: command.hunger,
      difficulty: command.difficulty,
    })

    return executeDicePool(pool, this.random)
  }
}
