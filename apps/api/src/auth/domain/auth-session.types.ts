import type {
  AuthenticatedUser,
  AuthUser,
} from './auth.types'

export interface AuthSession {
  readonly id: string
  readonly userId: string
  readonly tokenHash: string
  readonly expiresAt: Date
  readonly createdAt: Date
  readonly lastSeenAt: Date
  readonly revokedAt: Date | null
}

export interface CreateAuthSessionData {
  readonly userId: string
  readonly tokenHash: string
  readonly expiresAt: Date
  readonly createdAt: Date
}

export interface LoginCredentials {
  readonly username: string
  readonly password: string
}

export interface LoginResult {
  readonly user: AuthenticatedUser
  readonly sessionToken: string
  readonly expiresAt: Date
}

export const DEFAULT_AUTH_SESSION_TTL_MS =
  12 * 60 * 60 * 1000

export function toAuthenticatedUser(
  user: AuthUser,
): AuthenticatedUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    roles: [...user.roles],
  }
}
