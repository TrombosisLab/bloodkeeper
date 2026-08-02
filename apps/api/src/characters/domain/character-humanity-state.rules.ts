export type CharacterHumanityStateViolation =
  | 'HUMANITY_VALUE_INVALID'
  | 'HUMANITY_STAINS_INVALID'
  | 'HUMANITY_STAINS_EXCEED_AVAILABLE_BOXES'

export class InvalidCharacterHumanityStateError
  extends Error {
  readonly violations:
    CharacterHumanityStateViolation[]

  constructor(
    violations:
      CharacterHumanityStateViolation[],
  ) {
    super('Character Humanity state is invalid')
    this.name = 'InvalidCharacterHumanityStateError'
    this.violations = violations
  }
}

export function validateCharacterHumanityState(
  value: number,
  stains: number,
): CharacterHumanityStateViolation[] {
  const violations:
    CharacterHumanityStateViolation[] = []

  if (
    !Number.isInteger(value) ||
    value < 0 ||
    value > 10
  ) {
    violations.push('HUMANITY_VALUE_INVALID')
  }

  if (
    !Number.isInteger(stains) ||
    stains < 0 ||
    stains > 10
  ) {
    violations.push('HUMANITY_STAINS_INVALID')
  }

  if (
    Number.isInteger(value) &&
    Number.isInteger(stains) &&
    value + stains > 10
  ) {
    violations.push(
      'HUMANITY_STAINS_EXCEED_AVAILABLE_BOXES',
    )
  }

  return violations
}

export function assertValidCharacterHumanityState(
  value: number,
  stains: number,
): void {
  const violations =
    validateCharacterHumanityState(
      value,
      stains,
    )

  if (violations.length > 0) {
    throw new InvalidCharacterHumanityStateError(
      violations,
    )
  }
}
