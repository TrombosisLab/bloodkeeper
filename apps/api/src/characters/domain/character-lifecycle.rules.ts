import type {
  CharacterLifecycleStatus,
} from './persisted-character.types'

import type {
  CharacterValidationIssue,
  CharacterValidationReport,
} from './character-validation.types'

export interface CharacterLifecycleTransitionRequest {
  readonly from: CharacterLifecycleStatus
  readonly to: CharacterLifecycleStatus
  readonly authorized: boolean
  readonly confirmed: boolean
  readonly validation:
    CharacterValidationReport | null
}

export interface CharacterLifecycleTransitionResult {
  readonly allowed: boolean
  readonly issues:
    readonly CharacterValidationIssue[]
}

export class InvalidCharacterLifecycleTransitionError
  extends Error {
  readonly issues:
    readonly CharacterValidationIssue[]

  constructor(
    issues: readonly CharacterValidationIssue[],
  ) {
    super('Character lifecycle transition is invalid')
    this.name =
      'InvalidCharacterLifecycleTransitionError'
    this.issues = issues.map((issue) => ({
      ...issue,
      details:
        issue.details === undefined
          ? undefined
          : { ...issue.details },
    }))
  }
}

function lifecycleIssue(
  code: string,
  message: string,
  request: CharacterLifecycleTransitionRequest,
): CharacterValidationIssue {
  return {
    code,
    severity: 'error',
    section: 'lifecycle',
    field: 'status',
    message,
    details: {
      from: request.from,
      to: request.to,
    },
  }
}

function transitionExists(
  from: CharacterLifecycleStatus,
  to: CharacterLifecycleStatus,
): boolean {
  return (
    (from === 'draft' && to === 'active') ||
    (from === 'active' && to === 'archived') ||
    (from === 'archived' && to === 'active')
  )
}

function activationIsValid(
  report: CharacterValidationReport | null,
): boolean {
  return (
    report !== null &&
    report.context === 'activation' &&
    report.valid &&
    report.canProceed
  )
}

export function validateCharacterLifecycleTransition(
  request: CharacterLifecycleTransitionRequest,
): CharacterLifecycleTransitionResult {
  const issues: CharacterValidationIssue[] = []

  if (!request.authorized) {
    issues.push(
      lifecycleIssue(
        'CHARACTER_LIFECYCLE_PERMISSION_REQUIRED',
        'No tienes permiso para cambiar el estado del personaje.',
        request,
      ),
    )
  }

  if (!transitionExists(request.from, request.to)) {
    issues.push(
      lifecycleIssue(
        'CHARACTER_LIFECYCLE_TRANSITION_NOT_ALLOWED',
        'La transición de estado solicitada no está permitida.',
        request,
      ),
    )
  }

  if (
    request.from === 'active' &&
    request.to === 'archived' &&
    !request.confirmed
  ) {
    issues.push(
      lifecycleIssue(
        'CHARACTER_ARCHIVE_CONFIRMATION_REQUIRED',
        'Debes confirmar el archivado del personaje.',
        request,
      ),
    )
  }

  if (
    request.to === 'active' &&
    !activationIsValid(request.validation)
  ) {
    issues.push(
      lifecycleIssue(
        'CHARACTER_ACTIVATION_VALIDATION_REQUIRED',
        'El personaje debe superar la validación completa antes de activarse.',
        request,
      ),
    )
  }

  return {
    allowed: issues.length === 0,
    issues,
  }
}

export function assertCharacterLifecycleTransition(
  request: CharacterLifecycleTransitionRequest,
): void {
  const result =
    validateCharacterLifecycleTransition(request)

  if (!result.allowed) {
    throw new InvalidCharacterLifecycleTransitionError(
      result.issues,
    )
  }
}
