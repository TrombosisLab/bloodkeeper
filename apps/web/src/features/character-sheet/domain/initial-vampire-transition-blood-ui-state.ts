import {
  generationOptions,
} from '../../character-creation/data/identity-options.ts'

import {
  getBloodPotencyRange,
} from '../../character-creation/domain/blood-rules.ts'

import {
  CHARACTER_HUNGER_MAX,
  CHARACTER_HUNGER_MIN,
} from '../../character/domain/hunger-rules.ts'

import type {
  CharacterGeneration,
} from '../../character-creation/types/character-generation.types.ts'

function inclusiveIntegerRange(
  min: number,
  max: number,
): readonly number[] {
  if (
    !Number.isSafeInteger(min) ||
    !Number.isSafeInteger(max) ||
    max < min
  ) {
    return []
  }

  return Array.from(
    {
      length:
        max - min + 1,
    },
    (_, index) =>
      min + index,
  )
}

export function initialVampireTransitionGeneration(
  generation: number | null,
): CharacterGeneration | null {
  if (generation === null) {
    return null
  }

  return (
    generationOptions.find(
      (candidate) =>
        candidate === generation,
    ) ??
    null
  )
}

export function initialVampireBloodPotencyOptions(
  generation: number | null,
): readonly number[] {
  const canonicalGeneration =
    initialVampireTransitionGeneration(
      generation,
    )

  if (canonicalGeneration === null) {
    return []
  }

  const range =
    getBloodPotencyRange(
      canonicalGeneration,
    )

  return inclusiveIntegerRange(
    range.min,
    range.max,
  )
}

export const initialVampireHungerOptions:
  readonly number[] =
  inclusiveIntegerRange(
    CHARACTER_HUNGER_MIN,
    CHARACTER_HUNGER_MAX,
  )
