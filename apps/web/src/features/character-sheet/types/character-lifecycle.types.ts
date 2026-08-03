import type {
  CharacterValidationReport,
} from './character-validation.types.ts'

export type CharacterLifecycleStatus =
  | 'draft'
  | 'active'
  | 'archived'

export type CharacterLifecycleTargetStatus =
  Exclude<CharacterLifecycleStatus, 'draft'>

export interface CharacterLifecycleState {
  readonly characterId: string
  readonly status: CharacterLifecycleStatus
  readonly revision: number
}

export interface CharacterLifecycleSnapshot
  extends CharacterLifecycleState {
  readonly validation:
    CharacterValidationReport | null
}
