import type {
  DiceRandomSource,
} from './dice-random-source'

import type {
  BuiltDicePool,
} from '../domain/dice-pool.types'

import {
  resolveDiceRoll,
} from '../domain/dice-roll.rules'

import type {
  DiceRollResolution,
} from '../domain/dice-roll.types'

export interface ExecutedDiceRoll {
  readonly pool: BuiltDicePool
  readonly roll: DiceRollResolution
}

export function executeDicePool(
  pool: BuiltDicePool,
  random: DiceRandomSource,
): ExecutedDiceRoll {
  const normalDice = Array.from(
    { length: pool.normalDice },
    () => ({
      value: random.rollD10(),
      type: 'normal' as const,
    }),
  )
  const hungerDice = Array.from(
    { length: pool.hungerDice },
    () => ({
      value: random.rollD10(),
      type: 'hunger' as const,
    }),
  )

  return {
    pool,
    roll: resolveDiceRoll({
      dice: [...normalDice, ...hungerDice],
      difficulty: pool.difficulty,
    }),
  }
}
