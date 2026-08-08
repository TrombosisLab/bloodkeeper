import {
  deriveCharacterHealthCapacity,
  deriveCharacterWillpowerCapacity,
} from '@v5r/character-rules'

import type {
  PersistedCharacterAttributes,
  PersistedCharacterDamageState,
  PersistedCharacterDamageTrack,
} from './persisted-character.types'

export type CharacterDamageViolation =
  | 'DAMAGE_COUNT_INVALID'
  | 'HEALTH_DAMAGE_EXCEEDS_CAPACITY'
  | 'WILLPOWER_DAMAGE_EXCEEDS_CAPACITY'

export class InvalidCharacterDamageStateError
  extends Error {
  readonly violations: CharacterDamageViolation[]

  constructor(
    violations: CharacterDamageViolation[],
  ) {
    super('Character damage state is invalid')
    this.name = 'InvalidCharacterDamageStateError'
    this.violations = violations
  }
}

export function deriveHealthCapacity(
  attributes: PersistedCharacterAttributes,
): number {
  return deriveCharacterHealthCapacity(attributes)
}

export function deriveWillpowerCapacity(
  attributes: PersistedCharacterAttributes,
): number {
  return deriveCharacterWillpowerCapacity(attributes)
}

function hasInvalidCount(
  track: PersistedCharacterDamageTrack,
): boolean {
  return (
    !Number.isInteger(track.superficial) ||
    track.superficial < 0 ||
    !Number.isInteger(track.aggravated) ||
    track.aggravated < 0
  )
}

function totalDamage(
  track: PersistedCharacterDamageTrack,
): number {
  return track.superficial + track.aggravated
}

export function validateCharacterDamageState(
  attributes: PersistedCharacterAttributes,
  damage: PersistedCharacterDamageState,
): CharacterDamageViolation[] {
  const violations: CharacterDamageViolation[] = []

  if (
    hasInvalidCount(damage.health) ||
    hasInvalidCount(damage.willpower)
  ) {
    violations.push('DAMAGE_COUNT_INVALID')
    return violations
  }

  if (
    totalDamage(damage.health) >
    deriveHealthCapacity(attributes)
  ) {
    violations.push(
      'HEALTH_DAMAGE_EXCEEDS_CAPACITY',
    )
  }

  if (
    totalDamage(damage.willpower) >
    deriveWillpowerCapacity(attributes)
  ) {
    violations.push(
      'WILLPOWER_DAMAGE_EXCEEDS_CAPACITY',
    )
  }

  return violations
}

export function assertValidCharacterDamageState(
  attributes: PersistedCharacterAttributes,
  damage: PersistedCharacterDamageState,
): void {
  const violations = validateCharacterDamageState(
    attributes,
    damage,
  )

  if (violations.length > 0) {
    throw new InvalidCharacterDamageStateError(
      violations,
    )
  }
}
