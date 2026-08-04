import type {
  AuthSessionRepository,
} from './auth-session.repository'

import type {
  AuthUserRepository,
} from './auth-user.repository'

import type {
  PasswordHasher,
} from './password-hasher'

import type {
  SessionTokenService,
} from './session-token.service'

import {
  DEFAULT_AUTH_SESSION_TTL_MS,
  toAuthenticatedUser,
} from '../domain/auth-session.types'

import type {
  LoginCredentials,
  LoginResult,
} from '../domain/auth-session.types'

export class InvalidCredentialsError
  extends Error {
  constructor() {
    super('Invalid username or password')
    this.name = 'InvalidCredentialsError'
  }
}

export class LoginUseCase {
  constructor(
    private readonly users:
      AuthUserRepository,
    private readonly passwords:
      PasswordHasher,
    private readonly sessions:
      AuthSessionRepository,
    private readonly tokens:
      SessionTokenService,
    private readonly sessionTtlMs:
      number = DEFAULT_AUTH_SESSION_TTL_MS,
  ) {}

  async execute(
    credentials: LoginCredentials,
    now: Date = new Date(),
  ): Promise<LoginResult> {
    const username =
      credentials.username
        .trim()
        .toLowerCase()

    const user =
      await this.users.findByUsername(
        username,
      )

    if (user === null) {
      await this.passwords.hash(
        credentials.password,
      )

      throw new InvalidCredentialsError()
    }

    const passwordMatches =
      await this.passwords.verify(
        credentials.password,
        user.passwordHash,
      )

    if (
      !passwordMatches ||
      user.status !== 'active'
    ) {
      throw new InvalidCredentialsError()
    }

    const token =
      this.tokens.issue()

    const expiresAt =
      new Date(
        now.getTime() +
          this.sessionTtlMs,
      )

    await this.sessions.create({
      userId: user.id,
      tokenHash: token.tokenHash,
      expiresAt,
      createdAt: now,
    })

    return {
      user: toAuthenticatedUser(user),
      sessionToken: token.rawToken,
      expiresAt,
    }
  }
}
