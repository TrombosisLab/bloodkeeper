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
  readonly modifiers?: readonly DicePoolModifier[]
  readonly difficulty?: number | null
  readonly description?: string | null
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

  async preview(
    ownerId: string,
    command: ExecuteCharacterDiceRollCommand,
  ): Promise<BuiltDicePool | null> {
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

    return buildDicePool({
      components,
      modifier: command.modifier,
      modifiers: command.modifiers,
      hunger: hunger.hunger,
      difficulty: command.difficulty,
      context: {
        source: 'character',
        description: command.description,
      },
    })
  }

  async execute(
    ownerId: string,
    command: ExecuteCharacterDiceRollCommand,
  ): Promise<ExecutedDiceRoll | null> {
    const pool = await this.preview(ownerId, command)
    return pool === null
      ? null
      : executeDicePool(pool, this.random)
  }
}
