import type {
  AuthUserRepository,
} from './auth-user.repository'

import type {
  PasswordHasher,
} from './password-hasher'

import {
  buildInitialAdminUser,
  normalizeInitialAdminInput,
} from '../domain/auth-user.rules'

import type {
  InitialAdminInput,
} from '../domain/auth-user.rules'

import type {
  AuthUser,
} from '../domain/auth.types'

export class InitialAdminAlreadyExistsError
  extends Error {
  constructor() {
    super('Initial administrator already exists')
    this.name =
      'InitialAdminAlreadyExistsError'
  }
}

export class CreateInitialAdminUseCase {
  constructor(
    private readonly repository:
      AuthUserRepository,
    private readonly passwordHasher:
      PasswordHasher,
  ) {}

  async execute(
    input: InitialAdminInput,
  ): Promise<AuthUser> {
    const normalized =
      normalizeInitialAdminInput(input)

    const existing =
      await this.repository.findByUsername(
        normalized.username,
      )

    if (existing !== null) {
      throw new InitialAdminAlreadyExistsError()
    }

    const passwordHash =
      await this.passwordHasher.hash(
        normalized.password,
      )

    return this.repository.create(
      buildInitialAdminUser(
        normalized,
        passwordHash,
      ),
    )
  }
}
