import type {
  BuiltDicePool,
  BuiltDicePoolContext,
  DicePoolBuildInput,
  DicePoolComponent,
  DicePoolContext,
  DicePoolModifier,
} from './dice-pool.types'

export const DICE_POOL_HUNGER_MIN = 0
export const DICE_POOL_HUNGER_MAX = 5
export const DICE_POOL_DESCRIPTION_MAX_LENGTH = 160

export class DicePoolInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DicePoolInputError'
  }
}

function assertNamedValue(
  item: DicePoolComponent | DicePoolModifier,
  kind: 'component' | 'modifier',
): void {
  if (
    item.key.trim().length === 0 ||
    item.label.trim().length === 0 ||
    !Number.isSafeInteger(item.value) ||
    (kind === 'component' && item.value < 0)
  ) {
    throw new DicePoolInputError(
      `Pool ${kind}s require key, label and a valid safe integer value`,
    )
  }
}

function assertUniqueKeys(
  items: readonly (DicePoolComponent | DicePoolModifier)[],
  kind: 'component' | 'modifier',
): void {
  const keys = items.map((item) => item.key)
  if (new Set(keys).size !== keys.length) {
    throw new DicePoolInputError(
      `Dice pool ${kind} keys must be unique`,
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

function normalizedModifiers(
  input: DicePoolBuildInput,
): readonly DicePoolModifier[] {
  if (
    input.modifier !== undefined &&
    input.modifiers !== undefined
  ) {
    throw new DicePoolInputError(
      'Use either the aggregate modifier or structured modifiers, not both',
    )
  }

  if (input.modifiers !== undefined) {
    input.modifiers.forEach((modifier) =>
      assertNamedValue(modifier, 'modifier'))
    assertUniqueKeys(input.modifiers, 'modifier')
    return Object.freeze(
      input.modifiers.map((modifier) => Object.freeze({
        key: modifier.key,
        label: modifier.label,
        value: modifier.value,
      })),
    )
  }

  const value = input.modifier ?? 0
  if (!Number.isSafeInteger(value)) {
    throw new DicePoolInputError(
      'Modifier must be a safe integer',
    )
  }

  return value === 0
    ? Object.freeze([])
    : Object.freeze([Object.freeze({
        key: 'general',
        label: 'Modificador general',
        value,
      })])
}

function normalizedContext(
  context: DicePoolContext | null | undefined,
): BuiltDicePoolContext | null {
  if (context === null || context === undefined) {
    return null
  }

  if (
    context.source !== 'manual' &&
    context.source !== 'character' &&
    context.source !== 'action'
  ) {
    throw new DicePoolInputError(
      'Dice pool context requires a supported source',
    )
  }

  if (
    context.description !== null &&
    context.description !== undefined &&
    typeof context.description !== 'string'
  ) {
    throw new DicePoolInputError(
      'Dice pool description must be text when provided',
    )
  }

  const description = context.description?.trim() || null
  if (
    description !== null &&
    description.length > DICE_POOL_DESCRIPTION_MAX_LENGTH
  ) {
    throw new DicePoolInputError(
      `Dice pool description cannot exceed ${DICE_POOL_DESCRIPTION_MAX_LENGTH} characters`,
    )
  }

  return Object.freeze({
    source: context.source,
    description,
  })
}

export function buildDicePool(
  input: DicePoolBuildInput,
): BuiltDicePool {
  if (input.components.length === 0) {
    throw new DicePoolInputError(
      'A dice pool requires at least one component',
    )
  }

  input.components.forEach((component) =>
    assertNamedValue(component, 'component'))
  assertUniqueKeys(input.components, 'component')

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

  const components = Object.freeze(
    input.components.map((component) => Object.freeze({
      key: component.key,
      label: component.label,
      value: component.value,
    })),
  )
  const modifiers = normalizedModifiers(input)
  const basePool = components.reduce(
    (total, component) => total + component.value,
    0,
  )
  const modifier = modifiers.reduce(
    (total, item) => total + item.value,
    0,
  )
  const finalPool = basePool + modifier

  if (
    !Number.isSafeInteger(basePool) ||
    !Number.isSafeInteger(modifier) ||
    !Number.isSafeInteger(finalPool) ||
    finalPool < 1
  ) {
    throw new DicePoolInputError(
      'Final dice pool must contain at least one die',
    )
  }

  const hungerDice = Math.min(input.hunger, finalPool)

  return Object.freeze({
    components,
    modifiers,
    basePool,
    modifier,
    finalPool,
    normalDice: finalPool - hungerDice,
    hungerDice,
    difficulty: input.difficulty ?? null,
    context: normalizedContext(input.context),
  })
}
