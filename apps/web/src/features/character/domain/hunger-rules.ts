export const CHARACTER_HUNGER_MIN = 0
export const CHARACTER_HUNGER_MAX = 5
export const CHARACTER_INITIAL_HUNGER = 1

export interface CharacterHungerValidationResult {
  valid: boolean
  errors: string[]
}

export interface CharacterHungerTransitionResult
  extends CharacterHungerValidationResult {
  value: number
  changed: boolean
}

export function validateCharacterHunger(
  hunger: number,
): CharacterHungerValidationResult {
  const valid =
    Number.isInteger(hunger) &&
    hunger >= CHARACTER_HUNGER_MIN &&
    hunger <= CHARACTER_HUNGER_MAX

  return {
    valid,
    errors: valid
      ? []
      : [
          `El Hambre debe ser un entero entre ${CHARACTER_HUNGER_MIN} y ${CHARACTER_HUNGER_MAX}.`,
        ],
  }
}

/*
 * Normalización defensiva para entradas de creación y presentación.
 * Las operaciones de juego utilizan transiciones estrictas y no
 * convierten silenciosamente una transición imposible.
 */
export function normalizeCharacterHunger(
  hunger: number,
): number {
  if (!Number.isFinite(hunger)) {
    return CHARACTER_HUNGER_MIN
  }

  return Math.max(
    CHARACTER_HUNGER_MIN,
    Math.min(
      CHARACTER_HUNGER_MAX,
      Math.trunc(hunger),
    ),
  )
}

export function setCharacterHunger(
  current: number,
  next: number,
): CharacterHungerTransitionResult {
  const currentValidation =
    validateCharacterHunger(current)

  if (!currentValidation.valid) {
    return {
      valid: false,
      errors:
        currentValidation.errors,
      value: current,
      changed: false,
    }
  }

  const nextValidation =
    validateCharacterHunger(next)

  if (!nextValidation.valid) {
    return {
      valid: false,
      errors:
        nextValidation.errors,
      value: current,
      changed: false,
    }
  }

  return {
    valid: true,
    errors: [],
    value: next,
    changed: next !== current,
  }
}

function validateChangeAmount(
  amount: number,
): CharacterHungerValidationResult {
  const valid =
    Number.isInteger(amount) &&
    amount > 0

  return {
    valid,
    errors: valid
      ? []
      : [
          'La variación de Hambre debe ser un entero positivo.',
        ],
  }
}

function changeCharacterHunger(
  current: number,
  amount: number,
  direction: 1 | -1,
): CharacterHungerTransitionResult {
  const amountValidation =
    validateChangeAmount(amount)

  if (!amountValidation.valid) {
    return {
      valid: false,
      errors:
        amountValidation.errors,
      value: current,
      changed: false,
    }
  }

  return setCharacterHunger(
    current,
    current + amount * direction,
  )
}

export function increaseCharacterHunger(
  current: number,
  amount = 1,
): CharacterHungerTransitionResult {
  return changeCharacterHunger(
    current,
    amount,
    1,
  )
}

export function reduceCharacterHunger(
  current: number,
  amount = 1,
): CharacterHungerTransitionResult {
  return changeCharacterHunger(
    current,
    amount,
    -1,
  )
}
