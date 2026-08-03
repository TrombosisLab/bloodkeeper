export const characterValidationContexts = [
  'draftSave',
  'activation',
  'editing',
  'evolution',
  'play',
] as const

export type CharacterValidationContext =
  typeof characterValidationContexts[number]

export const characterValidationSections = [
  'identity',
  'attributes',
  'skills',
  'blood',
  'disciplines',
  'advantages',
  'humanity',
  'derived',
  'dependencies',
] as const

export type CharacterValidationSection =
  typeof characterValidationSections[number]

export type CharacterValidationTarget =
  | CharacterValidationSection
  | 'lifecycle'

export type CharacterValidationSeverity =
  | 'error'
  | 'warning'

export type CharacterSectionState =
  | 'complete'
  | 'pending'
  | 'invalid'

export type CharacterValidationDetail =
  string | number | boolean | null

export interface CharacterValidationIssue {
  readonly code: string
  readonly severity: CharacterValidationSeverity
  readonly section: CharacterValidationTarget
  readonly field: string | null
  readonly message: string
  readonly details?: Readonly<
    Record<string, CharacterValidationDetail>
  >
}

export interface CharacterSectionValidation {
  readonly section: CharacterValidationSection
  readonly state: CharacterSectionState
  readonly issues:
    readonly CharacterValidationIssue[]
}

export interface CharacterValidationReport {
  readonly context: CharacterValidationContext
  readonly valid: boolean
  readonly canProceed: boolean
  readonly sections:
    readonly CharacterSectionValidation[]
  readonly issues:
    readonly CharacterValidationIssue[]
}
