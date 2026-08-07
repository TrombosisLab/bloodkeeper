import type {
  CreateAuthUserData,
  UserRole,
} from './auth.types'

export interface AuthUserInput {
  readonly username: string
  readonly displayName: string
  readonly password: string
}

export interface NormalizedAuthUserInput {
  readonly username: string
  readonly displayName: string
  readonly password: string
}

export interface AuthUserIdentityInput {
  readonly username: string
  readonly displayName: string
}

export interface NormalizedAuthUserIdentityInput {
  readonly username: string
  readonly displayName: string
}

export type InitialAdminInput =
  AuthUserInput

export type NormalizedInitialAdminInput =
  NormalizedAuthUserInput

export interface PasswordRecoveryInput {
  readonly username: string
  readonly password: string
}

export interface NormalizedPasswordRecoveryInput {
  readonly username: string
  readonly password: string
}

export interface AuthUserRuleIssue {
  readonly code:
    | 'AUTH_USERNAME_INVALID'
    | 'AUTH_DISPLAY_NAME_INVALID'
    | 'AUTH_PASSWORD_TOO_SHORT'
    | 'AUTH_PASSWORD_TOO_LONG'
  readonly field:
    | 'username'
    | 'displayName'
    | 'password'
  readonly message: string
}

export class InvalidAuthUserError
  extends Error {
  readonly issues: readonly AuthUserRuleIssue[]

  constructor(
    issues: readonly AuthUserRuleIssue[],
  ) {
    super('Authentication user data is invalid')
    this.name = 'InvalidAuthUserError'
    this.issues = issues.map((issue) => ({
      ...issue,
    }))
  }
}

const usernamePattern =
  /^[a-z0-9][a-z0-9._-]{2,31}$/

export const INITIAL_ADMIN_ROLES =
  [
    'admin',
    'narrator',
    'player',
  ] as const satisfies readonly UserRole[]

function usernameIssues(
  username: string,
): readonly AuthUserRuleIssue[] {
  if (usernamePattern.test(username)) {
    return []
  }

  return [{
    code: 'AUTH_USERNAME_INVALID',
    field: 'username',
    message:
      'El usuario debe tener entre 3 y 32 caracteres y usar letras minúsculas, números, punto, guion o guion bajo.',
  }]
}

function passwordIssues(
  password: string,
): readonly AuthUserRuleIssue[] {
  const issues: AuthUserRuleIssue[] = []

  if (password.length < 12) {
    issues.push({
      code: 'AUTH_PASSWORD_TOO_SHORT',
      field: 'password',
      message:
        'La contraseña debe contener al menos 12 caracteres.',
    })
  }

  if (password.length > 200) {
    issues.push({
      code: 'AUTH_PASSWORD_TOO_LONG',
      field: 'password',
      message:
        'La contraseña no puede superar 200 caracteres.',
    })
  }

  return issues
}

export function normalizeAuthUserIdentityInput(
  input: AuthUserIdentityInput,
): NormalizedAuthUserIdentityInput {
  const username =
    input.username.trim().toLowerCase()
  const displayName =
    input.displayName.trim()
  const issues: AuthUserRuleIssue[] = [
    ...usernameIssues(username),
  ]

  if (
    displayName.length === 0 ||
    displayName.length > 80
  ) {
    issues.push({
      code: 'AUTH_DISPLAY_NAME_INVALID',
      field: 'displayName',
      message:
        'El nombre visible debe contener entre 1 y 80 caracteres.',
    })
  }

  if (issues.length > 0) {
    throw new InvalidAuthUserError(issues)
  }

  return {
    username,
    displayName,
  }
}

export function normalizeAuthUserInput(
  input: AuthUserInput,
): NormalizedAuthUserInput {
  const username =
    input.username.trim().toLowerCase()
  const displayName =
    input.displayName.trim()
  const issues: AuthUserRuleIssue[] = [
    ...usernameIssues(username),
    ...passwordIssues(input.password),
  ]

  if (
    displayName.length === 0 ||
    displayName.length > 80
  ) {
    issues.splice(1, 0, {
      code: 'AUTH_DISPLAY_NAME_INVALID',
      field: 'displayName',
      message:
        'El nombre visible debe contener entre 1 y 80 caracteres.',
    })
  }

  if (issues.length > 0) {
    throw new InvalidAuthUserError(issues)
  }

  return {
    username,
    displayName,
    password: input.password,
  }
}

export function normalizeInitialAdminInput(
  input: InitialAdminInput,
): NormalizedInitialAdminInput {
  return normalizeAuthUserInput(input)
}

export function normalizePasswordRecoveryInput(
  input: PasswordRecoveryInput,
): NormalizedPasswordRecoveryInput {
  const username =
    input.username.trim().toLowerCase()
  const issues: AuthUserRuleIssue[] = [
    ...usernameIssues(username),
    ...passwordIssues(input.password),
  ]

  if (issues.length > 0) {
    throw new InvalidAuthUserError(issues)
  }

  return {
    username,
    password: input.password,
  }
}

export function buildInitialAdminUser(
  input: NormalizedInitialAdminInput,
  passwordHash: string,
): CreateAuthUserData {
  return {
    username: input.username,
    displayName: input.displayName,
    passwordHash,
    status: 'active',
    roles: INITIAL_ADMIN_ROLES,
  }
}
