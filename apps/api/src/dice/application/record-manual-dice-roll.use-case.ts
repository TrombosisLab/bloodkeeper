import type {
  ExecuteManualDiceRollCommand,
  ExecuteManualDiceRollUseCase,
} from './execute-manual-dice-roll.use-case'

import type {
  DiceRollRepository,
} from './dice-roll.repository'

import {
  DiceRollContextValidator,
} from './dice-roll-context'

import type {
  DiceRollContextCommand,
  DiceRollRecord,
} from '../domain/dice-history.types'

export type RecordManualDiceRollCommand =
  ExecuteManualDiceRollCommand &
  DiceRollContextCommand

export const DICE_RULES_VERSION =
  'v5r-spec-038-v1'

export class RecordManualDiceRollUseCase {
  constructor(
    private readonly executor:
      ExecuteManualDiceRollUseCase,
    private readonly contexts:
      DiceRollContextValidator,
    private readonly records:
      DiceRollRepository,
  ) {}

  async execute(
    actorId: string,
    command: RecordManualDiceRollCommand,
  ): Promise<DiceRollRecord> {
    const context = await this.contexts.validate({
      actorId,
      characterId: null,
      characterChronicleId: null,
      command,
    })
    const result = this.executor.execute(command)

    return this.records.create({
      actorId,
      ...context,
      source: 'manual',
      description:
        result.pool.context?.description ?? null,
      rulesVersion: DICE_RULES_VERSION,
      pool: result.pool,
      roll: result.roll,
    })
  }
}
