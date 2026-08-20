import type {
  CharacterRulesDisciplineKey,
} from '@v5r/character-rules'

import type {
  DiceRandomSource,
} from './dice-random-source'

import type {
  CharacterDiceResonanceSnapshot,
} from './character-dice-resonance.adapter'

import {
  executeDicePool,
} from './dice-execution'

import type {
  ExecutedDiceRoll,
} from './dice-execution'

import {
  buildDicePool,
} from '../domain/dice-pool.rules'

import {
  CHARACTER_BLOOD_RESONANCE_DICE_MODIFIER_KEY,
  deriveCharacterBloodResonanceDiceModifier,
} from '../domain/character-dice-resonance.rules'

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

interface CharacterResonanceReader {
  execute(
    ownerId: string,
    characterId: string,
  ): Promise<
    CharacterDiceResonanceSnapshot | null
  >
}

export interface ExecuteCharacterDiceRollCommand {
  readonly characterId: string
  readonly attribute: string
  readonly skill?: string
  readonly disciplineKey?:
    CharacterRulesDisciplineKey
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
  private readonly ratings:
    CharacterRatingsReader
  private readonly hunger:
    CharacterHungerReader
  private readonly resonance:
    CharacterResonanceReader
  private readonly random:
    DiceRandomSource

  constructor(
    ratings: CharacterRatingsReader,
    hunger: CharacterHungerReader,
    resonanceOrRandom:
      CharacterResonanceReader | DiceRandomSource,
    random?: DiceRandomSource,
  ) {
    this.ratings = ratings
    this.hunger = hunger

    if (random === undefined) {
      this.random =
        resonanceOrRandom as DiceRandomSource

      this.resonance = {
        async execute() {
          return Object.freeze({
            disciplineKeys: Object.freeze([]),
            resonance: null,
          })
        },
      }
      return
    }

    this.resonance =
      resonanceOrRandom as CharacterResonanceReader
    this.random = random
  }

  async preview(
    ownerId: string,
    command: ExecuteCharacterDiceRollCommand,
  ): Promise<BuiltDicePool | null> {
    const [ratings, hunger, resonance] =
      await Promise.all([
        this.ratings.execute(
          ownerId,
          command.characterId,
        ),
        this.hunger.execute(
          ownerId,
          command.characterId,
        ),
        this.resonance.execute(
          ownerId,
          command.characterId,
        ),
      ])

    if (
      ratings === null ||
      hunger === null ||
      resonance === null
    ) {
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

    const disciplineKey =
      command.disciplineKey ?? null

    if (
      disciplineKey !== null &&
      !resonance.disciplineKeys.includes(
        disciplineKey,
      )
    ) {
      throw new DicePoolSelectionError(
        `discipline:${disciplineKey}`,
      )
    }

    if (
      command.modifiers?.some(
        ({ key }) =>
          key ===
          CHARACTER_BLOOD_RESONANCE_DICE_MODIFIER_KEY,
      )
    ) {
      throw new DicePoolSelectionError(
        `modifier:${CHARACTER_BLOOD_RESONANCE_DICE_MODIFIER_KEY}`,
      )
    }

    const resonanceModifier =
      deriveCharacterBloodResonanceDiceModifier(
        resonance.resonance,
        disciplineKey,
      )

    const effectiveModifiers =
      resonanceModifier === null
        ? command.modifiers
        : command.modifiers !== undefined
          ? [
              ...command.modifiers,
              resonanceModifier,
            ]
          : command.modifier === undefined ||
              command.modifier === 0
            ? [resonanceModifier]
            : [
                {
                  key: 'general',
                  label:
                    'Modificador general',
                  value: command.modifier,
                },
                resonanceModifier,
              ]

    const effectiveModifier =
      resonanceModifier === null ||
      command.modifiers !== undefined
        ? command.modifier
        : undefined

    return buildDicePool({
      components,
      modifier: effectiveModifier,
      modifiers: effectiveModifiers,
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
