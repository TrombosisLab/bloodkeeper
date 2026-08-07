import type {
  AuthSession,
  CreateAuthSessionData,
} from '../domain/auth-session.types'

export interface AuthSessionRepository {
  create(
    data: CreateAuthSessionData,
  ): Promise<AuthSession>

  findByTokenHash(
    tokenHash: string,
  ): Promise<AuthSession | null>

  markSeen(
    tokenHash: string,
    seenAt: Date,
  ): Promise<void>

  revokeByTokenHash(
    tokenHash: string,
    revokedAt: Date,
  ): Promise<boolean>

  revokeAllByUserId(
    userId: string,
    revokedAt: Date,
  ): Promise<number>
}
