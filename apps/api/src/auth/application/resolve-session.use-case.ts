import type {
  AuthSessionRepository,
} from './auth-session.repository'

import type {
  AuthUserRepository,
} from './auth-user.repository'

import type {
  SessionTokenService,
} from './session-token.service'

import {
  toAuthenticatedUser,
} from '../domain/auth-session.types'

import type {
  AuthenticatedUser,
} from '../domain/auth.types'

export class ResolveSessionUseCase {
  constructor(
    private readonly sessions:
      AuthSessionRepository,
    private readonly users:
      AuthUserRepository,
    private readonly tokens:
      SessionTokenService,
  ) {}

  async execute(
    rawToken: string,
    now: Date = new Date(),
  ): Promise<AuthenticatedUser | null> {
    const tokenHash =
      this.tokens.hash(rawToken)

    const session =
      await this.sessions.findByTokenHash(
        tokenHash,
      )

    if (
      session === null ||
      session.revokedAt !== null ||
      session.expiresAt.getTime() <=
        now.getTime()
    ) {
      return null
    }

    const user =
      await this.users.findById(
        session.userId,
      )

    if (
      user === null ||
      user.status !== 'active'
    ) {
      return null
    }

    await this.sessions.markSeen(
      tokenHash,
      now,
    )

    return toAuthenticatedUser(user)
  }
}
