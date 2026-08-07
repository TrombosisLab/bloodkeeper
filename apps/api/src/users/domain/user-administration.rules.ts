import {
  InvalidAuthUserError,
  normalizeAuthUserIdentityInput,
  normalizeAuthUserInput,
} from '../../auth/domain/auth-user.rules'

import type {
  AuthUserRuleIssue,
} from '../../auth/domain/auth-user.rules'

import type {
  UserAccountStatus,
  UserRole,
} from '../../auth/domain/auth.types'

import type {
  CreateUserAdministrationInput,
  UpdateUserAdministrationData,
} from './user-administration.types'

export interface NormalizedUserAdministrationInput {
  readonly username: string
  readonly displayName: string
  readonly password: string
  readonly roles: readonly UserRole[]
}

export interface UserAdministrationRuleIssue {
  readonly code: string
  readonly field:
    | 'username'
    | 'displayName'
    | 'password'
    | 'roles'
    | 'status'
  readonly message: string
}

export class InvalidUserAdministrationError
  extends Error {
  readonly issues:
    readonly UserAdministrationRuleIssue[]

  constructor(
    issues:
      readonly UserAdministrationRuleIssue[],
  ) {
    super('User administration data is invalid')
    this.name =
      'InvalidUserAdministrationError'
    this.issues = issues.map((issue) => ({
      ...issue,
    }))
  }
}

const roleOrder =
  [
    'admin',
    'narrator',
    'player',
  ] as const satisfies readonly UserRole[]

const allowedRoles =
  new Set<UserRole>(roleOrder)

const allowedStatuses =
  new Set<UserAccountStatus>([
    'active',
    'disabled',
  ])

function authIssues(
  error: InvalidAuthUserError,
): readonly UserAdministrationRuleIssue[] {
  return error.issues.map(
    (issue: AuthUserRuleIssue) => ({
      code: issue.code,
      field: issue.field,
      message: issue.message,
    }),
  )
}

export function normalizeUserAdministrationRoles(
  input: readonly UserRole[],
): readonly UserRole[] {
  const issues:
    UserAdministrationRuleIssue[] = []

  if (
    !Array.isArray(input) ||
    input.length === 0
  ) {
    issues.push({
      code: 'USER_ROLES_REQUIRED',
      field: 'roles',
      message:
        'Selecciona al menos un rol.',
    })
  } else {
    const seen = new Set<UserRole>()

    for (const role of input) {
      if (!allowedRoles.has(role)) {
        issues.push({
          code: 'USER_ROLE_INVALID',
          field: 'roles',
          message:
            'La selección contiene un rol no permitido.',
        })
        continue
      }

      if (seen.has(role)) {
        issues.push({
          code: 'USER_ROLE_DUPLICATED',
          field: 'roles',
          message:
            'No se puede repetir un rol.',
        })
        continue
      }

      seen.add(role)
    }
  }

  if (issues.length > 0) {
    throw new InvalidUserAdministrationError(
      issues,
    )
  }

  const selected =
    new Set(input)

  return roleOrder.filter(
    (role) => selected.has(role),
  )
}

export function normalizeUserAdministrationInput(
  input: CreateUserAdministrationInput,
): NormalizedUserAdministrationInput {
  const issues:
    UserAdministrationRuleIssue[] = []

  let normalizedBase:
    ReturnType<typeof normalizeAuthUserInput> |
    null = null

  let normalizedRoles:
    readonly UserRole[] | null = null

  try {
    normalizedBase =
      normalizeAuthUserInput(input)
  } catch (error: unknown) {
    if (
      error instanceof InvalidAuthUserError
    ) {
      issues.push(...authIssues(error))
    } else {
      throw error
    }
  }

  try {
    normalizedRoles =
      normalizeUserAdministrationRoles(
        input.roles,
      )
  } catch (error: unknown) {
    if (
      error instanceof
        InvalidUserAdministrationError
    ) {
      issues.push(...error.issues)
    } else {
      throw error
    }
  }

  if (
    issues.length > 0 ||
    normalizedBase === null ||
    normalizedRoles === null
  ) {
    throw new InvalidUserAdministrationError(
      issues,
    )
  }

  return {
    ...normalizedBase,
    roles: normalizedRoles,
  }
}

export function normalizeUserAdministrationUpdate(
  input: UpdateUserAdministrationData,
): UpdateUserAdministrationData {
  const issues:
    UserAdministrationRuleIssue[] = []

  let normalizedIdentity:
    ReturnType<
      typeof normalizeAuthUserIdentityInput
    > |
    null = null

  try {
    normalizedIdentity =
      normalizeAuthUserIdentityInput({
        username: input.username,
        displayName: input.displayName,
      })
  } catch (error: unknown) {
    if (
      error instanceof InvalidAuthUserError
    ) {
      issues.push(...authIssues(error))
    } else {
      throw error
    }
  }

  if (!allowedStatuses.has(input.status)) {
    issues.push({
      code: 'USER_STATUS_INVALID',
      field: 'status',
      message:
        'El estado debe ser active o disabled.',
    })
  }

  if (
    issues.length > 0 ||
    normalizedIdentity === null
  ) {
    throw new InvalidUserAdministrationError(
      issues,
    )
  }

  return {
    ...normalizedIdentity,
    status: input.status,
  }
}
