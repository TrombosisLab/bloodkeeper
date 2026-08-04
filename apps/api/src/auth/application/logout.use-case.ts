import type {
  AuthSessionRepository,
} from './auth-session.repository'

import type {
  SessionTokenService,
} from './session-token.service'

export class LogoutUseCase {
  constructor(
    private readonly sessions:
      AuthSessionRepository,
    private readonly tokens:
      SessionTokenService,
  ) {}

  async execute(
    rawToken: string,
    now: Date = new Date(),
  ): Promise<boolean> {
    return this.sessions.revokeByTokenHash(
      this.tokens.hash(rawToken),
      now,
    )
  }
}
