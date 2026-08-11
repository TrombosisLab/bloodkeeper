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

import type {
  BuiltDicePool,
  DicePoolModifier,
} from '../domain/dice-pool.types'

export interface ExecuteManualDiceRollCommand {
  readonly pool: number
  readonly hunger: number
  readonly modifier?: number
  readonly modifiers?: readonly DicePoolModifier[]
  readonly difficulty?: number | null
  readonly description?: string | null
}

export class ExecuteManualDiceRollUseCase {
  constructor(
    private readonly random: DiceRandomSource,
  ) {}

  preview(
    command: ExecuteManualDiceRollCommand,
  ): BuiltDicePool {
    return buildDicePool({
      components: [{
        key: 'manual_pool',
        label: 'Reserva manual',
        value: command.pool,
      }],
      modifier: command.modifier,
      modifiers: command.modifiers,
      hunger: command.hunger,
      difficulty: command.difficulty,
      context: {
        source: 'manual',
        description: command.description,
      },
    })
  }

  execute(
    command: ExecuteManualDiceRollCommand,
  ): ExecutedDiceRoll {
    return executeDicePool(
      this.preview(command),
      this.random,
    )
  }
}
