export const CHARACTER_HUNGER_MIN = 0
export const CHARACTER_HUNGER_MAX = 5

export type CharacterHungerViolation =
  'HUNGER_VALUE_INVALID'

export class InvalidCharacterHungerError
  extends Error {
  readonly violations:
    CharacterHungerViolation[]

  constructor(
    violations:
      CharacterHungerViolation[],
  ) {
    super('Character Hunger is invalid')
    this.name =
      'InvalidCharacterHungerError'
    this.violations = violations
  }
}

export function validateCharacterHunger(
  hunger: number,
): CharacterHungerViolation[] {
  if (
    !Number.isInteger(hunger) ||
    hunger < CHARACTER_HUNGER_MIN ||
    hunger > CHARACTER_HUNGER_MAX
  ) {
    return [
      'HUNGER_VALUE_INVALID',
    ]
  }

  return []
}

export function assertValidCharacterHunger(
  hunger: number,
): void {
  const violations =
    validateCharacterHunger(
      hunger,
    )

  if (violations.length > 0) {
    throw new InvalidCharacterHungerError(
      violations,
    )
  }
}
