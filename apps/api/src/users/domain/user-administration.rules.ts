import {
  InvalidAuthUserError,
  normalizeAuthUserInput,
} from '../../auth/domain/auth-user.rules'

import type {
  AuthUserRuleIssue,
} from '../../auth/domain/auth-user.rules'

import type {
  UserRole,
} from '../../auth/domain/auth.types'

import type {
  CreateUserAdministrationInput,
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

export function normalizeUserAdministrationInput(
  input: CreateUserAdministrationInput,
): NormalizedUserAdministrationInput {
  const issues:
    UserAdministrationRuleIssue[] = []

  let normalizedBase:
    ReturnType<typeof normalizeAuthUserInput> |
    null = null

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

  if (
    !Array.isArray(input.roles) ||
    input.roles.length === 0
  ) {
    issues.push({
      code: 'USER_ROLES_REQUIRED',
      field: 'roles',
      message:
        'Selecciona al menos un rol.',
    })
  } else {
    const seen = new Set<UserRole>()

    for (const role of input.roles) {
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

  if (
    issues.length > 0 ||
    normalizedBase === null
  ) {
    throw new InvalidUserAdministrationError(
      issues,
    )
  }

  const selected =
    new Set(input.roles)

  return {
    ...normalizedBase,
    roles: roleOrder.filter(
      (role) => selected.has(role),
    ),
  }
}
