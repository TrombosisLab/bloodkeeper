import type {
  DiceCriticalPairEvidence,
  DiceRollDieInput,
  DiceRollInput,
  DiceRollOutcome,
  DiceRollResolution,
  DiceRollSpecialEvidence,
  DiceRollSpecialResult,
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

interface IndexedCriticalTen {
  readonly index: number
  readonly type: 'normal' | 'hunger'
}

function removeAt<T>(values: T[], index: number): T {
  const [removed] = values.splice(index, 1)
  if (removed === undefined) {
    throw new DiceRollInputError(
      'Critical evidence could not be resolved',
    )
  }
  return removed
}

function criticalPair(
  first: IndexedCriticalTen,
  second: IndexedCriticalTen,
): DiceCriticalPairEvidence {
  return Object.freeze({
    firstDieIndex: Math.min(first.index, second.index),
    secondDieIndex: Math.max(first.index, second.index),
    involvesHunger:
      first.type === 'hunger' || second.type === 'hunger',
  })
}

function buildCriticalPairs(
  criticalTens: readonly IndexedCriticalTen[],
): readonly DiceCriticalPairEvidence[] {
  const remaining = [...criticalTens]
  const pairs: DiceCriticalPairEvidence[] = []

  // V5 classification treats a Hunger ten as participating whenever the
  // roll contains a critical pair. Pair it first so evidence is stable and
  // supports the same messy-critical decision for ambiguous 3+ ten pools.
  if (remaining.length >= 2) {
    const hungerPosition = remaining.findIndex(
      (die) => die.type === 'hunger',
    )
    if (hungerPosition !== -1) {
      const hunger = removeAt(remaining, hungerPosition)
      const normalPosition = remaining.findIndex(
        (die) => die.type === 'normal',
      )
      const counterpart = removeAt(
        remaining,
        normalPosition === -1 ? 0 : normalPosition,
      )
      pairs.push(criticalPair(hunger, counterpart))
    }
  }

  while (remaining.length >= 2) {
    pairs.push(criticalPair(
      removeAt(remaining, 0),
      removeAt(remaining, 0),
    ))
  }

  return Object.freeze(pairs)
}

function buildSpecialEvidence(
  dice: readonly ResolvedDiceRollDie[],
): DiceRollSpecialEvidence {
  const criticalTens = dice.flatMap((die, index) =>
    die.isCriticalTen ? [{ index, type: die.type }] : [],
  )
  const bestialFailureDieIndices = dice.flatMap(
    (die, index) => die.isBestialFailureDie ? [index] : [],
  )

  return Object.freeze({
    criticalTenIndices: Object.freeze(
      criticalTens.map((die) => die.index),
    ),
    hungerCriticalTenIndices: Object.freeze(
      criticalTens
        .filter((die) => die.type === 'hunger')
        .map((die) => die.index),
    ),
    criticalPairs: buildCriticalPairs(criticalTens),
    bestialFailureDieIndices: Object.freeze(
      bestialFailureDieIndices,
    ),
  })
}

function resolveSpecialResult(input: {
  readonly isSuccessful: boolean
  readonly evidence: DiceRollSpecialEvidence
}): DiceRollSpecialResult {
  // Classification priority is explicit and difficulty-aware:
  // 1. only a successful roll can be critical or messy critical;
  // 2. a failed roll with a Hunger 1 is a bestial failure;
  // 3. every other roll has no special result.
  if (
    input.isSuccessful &&
    input.evidence.criticalPairs.length > 0
  ) {
    return input.evidence.criticalPairs.some(
      (pair) => pair.involvesHunger,
    )
      ? 'messy_critical'
      : 'critical'
  }

  if (
    !input.isSuccessful &&
    input.evidence.bestialFailureDieIndices.length > 0
  ) {
    return 'bestial_failure'
  }

  return 'none'
}

function resolveOutcome(
  isSuccessful: boolean,
  specialResult: DiceRollSpecialResult,
): DiceRollOutcome {
  return specialResult === 'none'
    ? isSuccessful ? 'success' : 'failure'
    : specialResult
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
  const specialEvidence = buildSpecialEvidence(dice)
  const criticalPairs = specialEvidence.criticalPairs.length
  const criticalBonusSuccesses = criticalPairs * 2
  const totalSuccesses =
    regularSuccesses + criticalBonusSuccesses
  const difficulty = input.difficulty ?? null
  const isSuccessful = difficulty === null
    ? totalSuccesses > 0
    : totalSuccesses >= difficulty
  const specialResult = resolveSpecialResult({
    isSuccessful,
    evidence: specialEvidence,
  })

  return {
    dice,
    difficulty,
    regularSuccesses,
    criticalPairs,
    criticalBonusSuccesses,
    totalSuccesses,
    isSuccessful,
    specialResult,
    specialEvidence,
    outcome: resolveOutcome(isSuccessful, specialResult),
    meetsDifficulty:
      difficulty === null
        ? null
        : isSuccessful,
  }
}
