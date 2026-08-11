import type {
  BuiltDicePool,
  DicePoolBuildInput,
  DicePoolComponent,
} from './dice-pool.types'

export const DICE_POOL_HUNGER_MIN = 0
export const DICE_POOL_HUNGER_MAX = 5

export class DicePoolInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DicePoolInputError'
  }
}

function assertComponent(
  component: DicePoolComponent,
): void {
  if (
    component.key.trim().length === 0 ||
    component.label.trim().length === 0 ||
    !Number.isSafeInteger(component.value) ||
    component.value < 0
  ) {
    throw new DicePoolInputError(
      'Pool components require key, label and a non-negative safe integer value',
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
    throw new DicePoolInputError(
      'Difficulty must be a positive safe integer when provided',
    )
  }
}

export function buildDicePool(
  input: DicePoolBuildInput,
): BuiltDicePool {
  if (input.components.length === 0) {
    throw new DicePoolInputError(
      'A dice pool requires at least one component',
    )
  }

  input.components.forEach(assertComponent)

  const keys = input.components.map(
    (component) => component.key,
  )
  if (new Set(keys).size !== keys.length) {
    throw new DicePoolInputError(
      'Dice pool component keys must be unique',
    )
  }

  const modifier = input.modifier ?? 0
  if (!Number.isSafeInteger(modifier)) {
    throw new DicePoolInputError(
      'Modifier must be a safe integer',
    )
  }

  if (
    !Number.isSafeInteger(input.hunger) ||
    input.hunger < DICE_POOL_HUNGER_MIN ||
    input.hunger > DICE_POOL_HUNGER_MAX
  ) {
    throw new DicePoolInputError(
      'Hunger must be an integer from 0 to 5',
    )
  }

  assertDifficulty(input.difficulty)

  const components = input.components.map(
    (component) => Object.freeze({
      key: component.key,
      label: component.label,
      value: component.value,
    }),
  )
  const basePool = components.reduce(
    (total, component) => total + component.value,
    0,
  )
  const finalPool = basePool + modifier

  if (!Number.isSafeInteger(finalPool) || finalPool < 1) {
    throw new DicePoolInputError(
      'Final dice pool must contain at least one die',
    )
  }

  const hungerDice = Math.min(
    input.hunger,
    finalPool,
  )

  return Object.freeze({
    components: Object.freeze(components),
    basePool,
    modifier,
    finalPool,
    normalDice: finalPool - hungerDice,
    hungerDice,
    difficulty: input.difficulty ?? null,
  })
}
