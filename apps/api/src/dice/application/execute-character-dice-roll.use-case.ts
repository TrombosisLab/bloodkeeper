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

interface CharacterRatingsSnapshot {
  readonly attributes: object
  readonly skills: object
}

interface CharacterRatingsReader {
  execute(
    ownerId: string,
    characterId: string,
  ): Promise<CharacterRatingsSnapshot | null>
}

interface CharacterHungerReader {
  execute(
    ownerId: string,
    characterId: string,
  ): Promise<{
    readonly hunger: number
  } | null>
}

export interface ExecuteCharacterDiceRollCommand {
  readonly characterId: string
  readonly attribute: string
  readonly skill?: string
  readonly modifier?: number
  readonly difficulty?: number | null
}

export class DicePoolSelectionError extends Error {
  constructor(readonly selection: string) {
    super(`Unknown or invalid dice pool selection: ${selection}`)
    this.name = 'DicePoolSelectionError'
  }
}

function selectedRating(
  ratings: object,
  key: string,
): number {
  const value = (
    ratings as Record<string, unknown>
  )[key]

  if (
    !Object.prototype.hasOwnProperty.call(ratings, key) ||
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw new DicePoolSelectionError(key)
  }

  return value
}

export class ExecuteCharacterDiceRollUseCase {
  constructor(
    private readonly ratings:
      CharacterRatingsReader,
    private readonly hunger:
      CharacterHungerReader,
    private readonly random:
      DiceRandomSource,
  ) {}

  async execute(
    ownerId: string,
    command: ExecuteCharacterDiceRollCommand,
  ): Promise<ExecutedDiceRoll | null> {
    const [ratings, hunger] = await Promise.all([
      this.ratings.execute(
        ownerId,
        command.characterId,
      ),
      this.hunger.execute(
        ownerId,
        command.characterId,
      ),
    ])

    if (ratings === null || hunger === null) {
      return null
    }

    const components = [{
      key: `attribute:${command.attribute}`,
      label: command.attribute,
      value: selectedRating(
        ratings.attributes,
        command.attribute,
      ),
    }]

    if (command.skill !== undefined) {
      components.push({
        key: `skill:${command.skill}`,
        label: command.skill,
        value: selectedRating(
          ratings.skills,
          command.skill,
        ),
      })
    }

    const pool = buildDicePool({
      components,
      modifier: command.modifier,
      hunger: hunger.hunger,
      difficulty: command.difficulty,
    })

    return executeDicePool(pool, this.random)
  }
}
