export type UserAccountStatus =
  | 'active'
  | 'disabled'

export type UserRole =
  | 'admin'
  | 'narrator'
  | 'player'

export interface AuthUser {
  readonly id: string
  readonly username: string
  readonly displayName: string
  readonly passwordHash: string
  readonly status: UserAccountStatus
  readonly roles: readonly UserRole[]
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface CreateAuthUserData {
  readonly username: string
  readonly displayName: string
  readonly passwordHash: string
  readonly status: UserAccountStatus
  readonly roles: readonly UserRole[]
}
