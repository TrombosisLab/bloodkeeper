import type {
  CharacterValidationReport,
} from './character-validation.types.ts'

export type CharacterLifecycleStatus =
  | 'draft'
  | 'active'
  | 'archived'

export type CharacterLifecycleTargetStatus =
  Exclude<CharacterLifecycleStatus, 'draft'>

export interface CharacterLifecycleSnapshot {
  readonly characterId: string
  readonly status: CharacterLifecycleStatus
  readonly revision: number
  readonly validation:
    CharacterValidationReport | null
}
