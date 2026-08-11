import type {
  DiceRollDieInput,
  DiceRollInput,
  DiceRollOutcome,
  DiceRollResolution,
  ResolvedDiceRollDie,
} from './dice-roll.types'

export class DiceRollInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DiceRollInputError'
  }
}

function assertDiceRollDie(
  die: DiceRollDieInput,
): void {
  if (
    !Number.isSafeInteger(die.value) ||
    die.value < 1 ||
    die.value > 10 ||
    (die.type !== 'normal' && die.type !== 'hunger')
  ) {
    throw new DiceRollInputError(
      'Each die must have a value from 1 to 10 and a valid type',
    )
  }
}

function assertDifficulty(
  difficulty: number | null | undefined,
): void {
  if (
    difficulty !== null &&
    difficulty !== undefined &&
    (!Number.isSafeInteger(difficulty) || difficulty < 1)
  ) {
    throw new DiceRollInputError(
      'Difficulty must be a positive safe integer when provided',
    )
  }
}

function resolveDie(
  die: DiceRollDieInput,
): ResolvedDiceRollDie {
  return {
    ...die,
    isSuccess: die.value >= 6,
    isCriticalTen: die.value === 10,
    isBestialFailureDie:
      die.type === 'hunger' && die.value === 1,
  }
}

function resolveOutcome(input: {
  readonly totalSuccesses: number
  readonly criticalPairs: number
  readonly hasHungerCriticalTen: boolean
  readonly hasBestialFailureDie: boolean
}): DiceRollOutcome {
  if (input.criticalPairs > 0) {
    return input.hasHungerCriticalTen
      ? 'messy_critical'
      : 'critical'
  }

  if (
    input.totalSuccesses === 0 &&
    input.hasBestialFailureDie
  ) {
    return 'bestial_failure'
  }

  return input.totalSuccesses > 0
    ? 'success'
    : 'failure'
}

export function resolveDiceRoll(
  input: DiceRollInput,
): DiceRollResolution {
  if (input.dice.length === 0) {
    throw new DiceRollInputError(
      'A dice roll requires at least one die',
    )
  }

  assertDifficulty(input.difficulty)
  input.dice.forEach(assertDiceRollDie)

  const dice = input.dice.map(resolveDie)
  const regularSuccesses = dice.filter(
    (die) => die.isSuccess,
  ).length
  const criticalTens = dice.filter(
    (die) => die.isCriticalTen,
  )
  const criticalPairs = Math.floor(
    criticalTens.length / 2,
  )
  const criticalBonusSuccesses = criticalPairs * 2
  const totalSuccesses =
    regularSuccesses + criticalBonusSuccesses
  const difficulty = input.difficulty ?? null

  return {
    dice,
    difficulty,
    regularSuccesses,
    criticalPairs,
    criticalBonusSuccesses,
    totalSuccesses,
    outcome: resolveOutcome({
      totalSuccesses,
      criticalPairs,
      hasHungerCriticalTen: criticalTens.some(
        (die) => die.type === 'hunger',
      ),
      hasBestialFailureDie: dice.some(
        (die) => die.isBestialFailureDie,
      ),
    }),
    meetsDifficulty:
      difficulty === null
        ? null
        : totalSuccesses >= difficulty,
  }
}
