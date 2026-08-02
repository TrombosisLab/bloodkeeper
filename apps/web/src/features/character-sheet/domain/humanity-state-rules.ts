export const MAX_HUMANITY = 10

export type HumanityBoxState =
  | 'humanity'
  | 'stain'
  | 'empty'

export interface CharacterHumanityState {
  value: number
  stains: number
}

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
  state: CharacterHumanityState,
): CharacterHumanityStateViolation[] {
  const violations:
    CharacterHumanityStateViolation[] = []

  if (
    !Number.isInteger(state.value) ||
    state.value < 0 ||
    state.value > MAX_HUMANITY
  ) {
    violations.push('HUMANITY_VALUE_INVALID')
  }

  if (
    !Number.isInteger(state.stains) ||
    state.stains < 0 ||
    state.stains > MAX_HUMANITY
  ) {
    violations.push('HUMANITY_STAINS_INVALID')
  }

  if (
    Number.isInteger(state.value) &&
    Number.isInteger(state.stains) &&
    state.value + state.stains >
      MAX_HUMANITY
  ) {
    violations.push(
      'HUMANITY_STAINS_EXCEED_AVAILABLE_BOXES',
    )
  }

  return violations
}

export function toHumanityBoxStates(
  state: CharacterHumanityState,
): HumanityBoxState[] {
  const violations =
    validateCharacterHumanityState(state)

  if (violations.length > 0) {
    throw new InvalidCharacterHumanityStateError(
      violations,
    )
  }

  return [
    ...Array<HumanityBoxState>(
      state.value,
    ).fill('humanity'),
    ...Array<HumanityBoxState>(
      state.stains,
    ).fill('stain'),
    ...Array<HumanityBoxState>(
      MAX_HUMANITY -
        state.value -
        state.stains,
    ).fill('empty'),
  ]
}
