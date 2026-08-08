import type {
  CharacterLifecycleStatus,
} from './persisted-character.types'

export type CharacterStateUpdateViolation =
  'CHARACTER_STATE_NOT_EDITABLE'

export class InvalidCharacterStateUpdateError
  extends Error {
  readonly violations:
    readonly CharacterStateUpdateViolation[]

  constructor(
    violations:
      readonly CharacterStateUpdateViolation[],
  ) {
    super('Character state cannot be edited')
    this.name = 'InvalidCharacterStateUpdateError'
    this.violations = [...violations]
  }
}

export function assertCharacterStateEditable(
  status: CharacterLifecycleStatus,
): void {
  if (status === 'archived') {
    throw new InvalidCharacterStateUpdateError([
      'CHARACTER_STATE_NOT_EDITABLE',
    ])
  }
}
