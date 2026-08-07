import type {
  AuthSessionRepository,
} from './auth-session.repository'

import type {
  AuthUserRepository,
} from './auth-user.repository'

import type {
  PasswordHasher,
} from './password-hasher'

import {
  normalizePasswordRecoveryInput,
} from '../domain/auth-user.rules'

import type {
  PasswordRecoveryInput,
} from '../domain/auth-user.rules'

import type {
  AuthUser,
} from '../domain/auth.types'

export class AuthRecoveryUserNotFoundError
  extends Error {
  constructor() {
    super('Authentication recovery user not found')
    this.name =
      'AuthRecoveryUserNotFoundError'
  }
}

export class ResetUserPasswordUseCase {
  constructor(
    private readonly users:
      AuthUserRepository,
    private readonly sessions:
      AuthSessionRepository,
    private readonly passwordHasher:
      PasswordHasher,
    private readonly now:
      () => Date = () => new Date(),
  ) {}

  async execute(
    input: PasswordRecoveryInput,
  ): Promise<AuthUser> {
    const normalized =
      normalizePasswordRecoveryInput(input)

    const user =
      await this.users.findByUsername(
        normalized.username,
      )

    if (user === null) {
      throw new AuthRecoveryUserNotFoundError()
    }

    const passwordHash =
      await this.passwordHasher.hash(
        normalized.password,
      )

    const revokedAt = this.now()

    await this.sessions.revokeAllByUserId(
      user.id,
      revokedAt,
    )

    return this.users.updatePasswordHash(
      user.id,
      passwordHash,
    )
  }
}
