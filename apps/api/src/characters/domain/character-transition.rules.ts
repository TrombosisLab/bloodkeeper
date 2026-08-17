import type {
  PersistedCharacterDraft,
} from './persisted-character.types'

import type {
  CharacterValidationContext,
  CharacterValidationSeverity,
} from './character-validation.types'

export function isSessionZeroTransitionalVampire(
  character: Pick<
    PersistedCharacterDraft,
    'nature' | 'creation'
  >,
): boolean {
  return (
    character.nature === 'vampire' &&
    character.creation.creationMode ===
      'sessionZero'
  )
}

export function allowsSessionZeroPendingVampireState(
  character: Pick<
    PersistedCharacterDraft,
    'nature' | 'creation'
  >,
  context: CharacterValidationContext,
): boolean {
  return (
    isSessionZeroTransitionalVampire(character) &&
    context !== 'activation' &&
    context !== 'evolution'
  )
}

export function vampireRequirementSeverity(
  character: Pick<
    PersistedCharacterDraft,
    'nature' | 'creation'
  >,
  context: CharacterValidationContext,
): CharacterValidationSeverity {
  if (
    allowsSessionZeroPendingVampireState(
      character,
      context,
    )
  ) {
    return 'warning'
  }

  return context === 'draftSave'
    ? 'warning'
    : 'error'
}

export const CHARACTER_PROFILE_PHASES = [
  'HUMAN',
  'TRANSITIONAL_VAMPIRE',
  'ESTABLISHED_VAMPIRE',
] as const

export type CharacterProfilePhase =
  typeof CHARACTER_PROFILE_PHASES[number]

export function deriveCharacterProfilePhase(
  character: Pick<
    PersistedCharacterDraft,
    'nature' | 'creation'
  >,
  fullVampireProfileValid: boolean,
): CharacterProfilePhase {
  if (character.nature === 'human') {
    return 'HUMAN'
  }

  if (fullVampireProfileValid) {
    return 'ESTABLISHED_VAMPIRE'
  }

  if (
    character.creation.creationMode ===
      'sessionZero'
  ) {
    return 'TRANSITIONAL_VAMPIRE'
  }

  throw new Error(
    'STANDARD_VAMPIRE_PROFILE_INVALID',
  )
}
