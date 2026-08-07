import type {
  UserAccountStatus,
  UserRole,
} from '../../auth/domain/auth.types'

export interface UserAdministrationRecord {
  readonly id: string
  readonly username: string
  readonly displayName: string
  readonly status: UserAccountStatus
  readonly roles: readonly UserRole[]
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface CreateUserAdministrationInput {
  readonly username: string
  readonly displayName: string
  readonly password: string
  readonly roles: readonly UserRole[]
}

export interface CreateUserAdministrationData {
  readonly username: string
  readonly displayName: string
  readonly passwordHash: string
  readonly status: UserAccountStatus
  readonly roles: readonly UserRole[]
}

export interface UpdateUserAdministrationInput {
  readonly userId: string
  readonly username?: string
  readonly displayName?: string
  readonly status?: UserAccountStatus
}

export interface UpdateUserAdministrationData {
  readonly username: string
  readonly displayName: string
  readonly status: UserAccountStatus
}

export interface ResetUserCredentialsInput {
  readonly userId: string
  readonly password: string
}

export interface UpdateUserRolesInput {
  readonly userId: string
  readonly roles: readonly UserRole[]
}
