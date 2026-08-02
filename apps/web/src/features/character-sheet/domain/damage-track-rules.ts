export type DamageState =
  | 'empty'
  | 'superficial'
  | 'aggravated'

export interface CharacterDamageTrack {
  superficial: number
  aggravated: number
}

export const MAX_DAMAGE_TRACK_CAPACITY = 10

export type CharacterDamageTrackViolation =
  | 'CAPACITY_OUT_OF_RANGE'
  | 'DAMAGE_COUNT_INVALID'
  | 'DAMAGE_EXCEEDS_CAPACITY'
  | 'BOX_INDEX_OUT_OF_RANGE'

export class InvalidCharacterDamageTrackError
  extends Error {
  readonly violations:
    CharacterDamageTrackViolation[]

  constructor(
    violations:
      CharacterDamageTrackViolation[],
  ) {
    super('Character damage track is invalid')
    this.name = 'InvalidCharacterDamageTrackError'
    this.violations = violations
  }
}

export function createEmptyDamageTrack():
  CharacterDamageTrack {
  return {
    superficial: 0,
    aggravated: 0,
  }
}

export function validateCharacterDamageTrack(
  capacity: number,
  track: CharacterDamageTrack,
): CharacterDamageTrackViolation[] {
  const violations:
    CharacterDamageTrackViolation[] = []

  if (
    !Number.isInteger(capacity) ||
    capacity < 0 ||
    capacity > MAX_DAMAGE_TRACK_CAPACITY
  ) {
    violations.push('CAPACITY_OUT_OF_RANGE')
  }

  if (
    !Number.isInteger(track.superficial) ||
    track.superficial < 0 ||
    !Number.isInteger(track.aggravated) ||
    track.aggravated < 0
  ) {
    violations.push('DAMAGE_COUNT_INVALID')
  }

  if (
    Number.isInteger(capacity) &&
    Number.isInteger(track.superficial) &&
    Number.isInteger(track.aggravated) &&
    track.superficial + track.aggravated >
      capacity
  ) {
    violations.push('DAMAGE_EXCEEDS_CAPACITY')
  }

  return violations
}

export function toDamageStates(
  capacity: number,
  track: CharacterDamageTrack,
): DamageState[] {
  const violations =
    validateCharacterDamageTrack(
      capacity,
      track,
    )

  if (violations.length > 0) {
    throw new InvalidCharacterDamageTrackError(
      violations,
    )
  }

  return [
    ...Array<DamageState>(
      track.aggravated,
    ).fill('aggravated'),
    ...Array<DamageState>(
      track.superficial,
    ).fill('superficial'),
    ...Array<DamageState>(
      capacity -
        track.aggravated -
        track.superficial,
    ).fill('empty'),
  ]
}

export function getNextDamageState(
  state: DamageState,
): DamageState {
  switch (state) {
    case 'empty':
      return 'superficial'

    case 'superficial':
      return 'aggravated'

    case 'aggravated':
      return 'empty'
  }
}

export function setDamageBoxState(
  capacity: number,
  track: CharacterDamageTrack,
  boxIndex: number,
  nextState: DamageState,
): CharacterDamageTrack {
  const states = toDamageStates(
    capacity,
    track,
  )

  if (
    !Number.isInteger(boxIndex) ||
    boxIndex < 0 ||
    boxIndex >= capacity
  ) {
    throw new InvalidCharacterDamageTrackError(
      ['BOX_INDEX_OUT_OF_RANGE'],
    )
  }

  states[boxIndex] = nextState

  return {
    superficial: states.filter(
      (state) => state === 'superficial',
    ).length,
    aggravated: states.filter(
      (state) => state === 'aggravated',
    ).length,
  }
}

export function cycleDamageBoxState(
  capacity: number,
  track: CharacterDamageTrack,
  boxIndex: number,
): CharacterDamageTrack {
  const states = toDamageStates(
    capacity,
    track,
  )

  if (
    !Number.isInteger(boxIndex) ||
    boxIndex < 0 ||
    boxIndex >= capacity
  ) {
    throw new InvalidCharacterDamageTrackError(
      ['BOX_INDEX_OUT_OF_RANGE'],
    )
  }

  return setDamageBoxState(
    capacity,
    track,
    boxIndex,
    getNextDamageState(states[boxIndex]),
  )
}
