import type {
  ExecuteCharacterDiceRollCommand,
  ExecuteCharacterDiceRollUseCase,
} from './execute-character-dice-roll.use-case'

import type {
  DiceRollRepository,
} from './dice-roll.repository'

import {
  DiceRollContextValidator,
} from './dice-roll-context'

import {
  DICE_RULES_VERSION,
} from './record-manual-dice-roll.use-case'

import type {
  DiceRollContextCommand,
  DiceRollRecord,
} from '../domain/dice-history.types'

interface CharacterContextReader {
  execute(
    ownerId: string,
    characterId: string,
  ): Promise<{
    readonly chronicleId: string | null
  } | null>
}

export type RecordCharacterDiceRollCommand =
  ExecuteCharacterDiceRollCommand &
  DiceRollContextCommand

export class RecordCharacterDiceRollUseCase {
  constructor(
    private readonly executor:
      ExecuteCharacterDiceRollUseCase,
    private readonly characters:
      CharacterContextReader,
    private readonly contexts:
      DiceRollContextValidator,
    private readonly records:
      DiceRollRepository,
  ) {}

  async execute(
    actorId: string,
    command: RecordCharacterDiceRollCommand,
  ): Promise<DiceRollRecord | null> {
    const character = await this.characters.execute(
      actorId,
      command.characterId,
    )
    if (character === null) {
      return null
    }

    const context = await this.contexts.validate({
      actorId,
      characterId: command.characterId,
      characterChronicleId:
        character.chronicleId,
      command,
    })
    const result = await this.executor.execute(
      actorId,
      command,
    )
    if (result === null) {
      return null
    }

    return this.records.create({
      actorId,
      ...context,
      source: 'character',
      description:
        result.pool.context?.description ?? null,
      rulesVersion: DICE_RULES_VERSION,
      pool: result.pool,
      roll: result.roll,
    })
  }
}
