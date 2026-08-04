import type {
  ChronicleStatus,
} from './chronicle.types'

export interface ChronicleLifecycleTransitionRequest {
  readonly from: ChronicleStatus
  readonly to: ChronicleStatus
  readonly authorized: boolean
}

export interface ChronicleLifecycleIssue {
  readonly code: string
  readonly field: 'status'
  readonly message: string
  readonly details: {
    readonly from: ChronicleStatus
    readonly to: ChronicleStatus
  }
}

export interface ChronicleLifecycleTransitionResult {
  readonly allowed: boolean
  readonly issues: readonly ChronicleLifecycleIssue[]
}

export class InvalidChronicleLifecycleTransitionError
  extends Error {
  readonly issues: readonly ChronicleLifecycleIssue[]

  constructor(
    issues: readonly ChronicleLifecycleIssue[],
  ) {
    super('Chronicle lifecycle transition is invalid')
    this.name =
      'InvalidChronicleLifecycleTransitionError'
    this.issues = issues.map((issue) => ({
      ...issue,
      details: { ...issue.details },
    }))
  }
}

function issue(
  code: string,
  message: string,
  request: ChronicleLifecycleTransitionRequest,
): ChronicleLifecycleIssue {
  return {
    code,
    field: 'status',
    message,
    details: {
      from: request.from,
      to: request.to,
    },
  }
}

function transitionExists(
  from: ChronicleStatus,
  to: ChronicleStatus,
): boolean {
  return (
    (from === 'preparation' && to === 'active') ||
    (from === 'active' && to === 'archived') ||
    (from === 'archived' && to === 'active')
  )
}

export function validateChronicleLifecycleTransition(
  request: ChronicleLifecycleTransitionRequest,
): ChronicleLifecycleTransitionResult {
  const issues: ChronicleLifecycleIssue[] = []

  if (!request.authorized) {
    issues.push(
      issue(
        'CHRONICLE_LIFECYCLE_PERMISSION_REQUIRED',
        'No tienes permiso para cambiar el estado de la crónica.',
        request,
      ),
    )
  }

  if (!transitionExists(request.from, request.to)) {
    issues.push(
      issue(
        'CHRONICLE_LIFECYCLE_TRANSITION_NOT_ALLOWED',
        'La transición de estado solicitada no está permitida.',
        request,
      ),
    )
  }

  return {
    allowed: issues.length === 0,
    issues,
  }
}

export function assertChronicleLifecycleTransition(
  request: ChronicleLifecycleTransitionRequest,
): void {
  const result =
    validateChronicleLifecycleTransition(request)

  if (!result.allowed) {
    throw new InvalidChronicleLifecycleTransitionError(
      result.issues,
    )
  }
}
