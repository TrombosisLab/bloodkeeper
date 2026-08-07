import type {
  PasswordHasher,
} from '../../auth/application/password-hasher'

import type {
  UserAdministrationRepository,
} from './user-administration.repository'

import {
  normalizeUserAdministrationInput,
} from '../domain/user-administration.rules'

import type {
  CreateUserAdministrationInput,
  UserAdministrationRecord,
} from '../domain/user-administration.types'

export class UserAlreadyExistsError
  extends Error {
  constructor() {
    super('User already exists')
    this.name = 'UserAlreadyExistsError'
  }
}

export class CreateUserUseCase {
  constructor(
    private readonly users:
      UserAdministrationRepository,
    private readonly passwords:
      PasswordHasher,
  ) {}

  async execute(
    input: CreateUserAdministrationInput,
  ): Promise<UserAdministrationRecord> {
    const normalized =
      normalizeUserAdministrationInput(
        input,
      )

    const existing =
      await this.users.findByUsername(
        normalized.username,
      )

    if (existing !== null) {
      throw new UserAlreadyExistsError()
    }

    const passwordHash =
      await this.passwords.hash(
        normalized.password,
      )

    return this.users.create({
      username: normalized.username,
      displayName:
        normalized.displayName,
      passwordHash,
      status: 'active',
      roles: normalized.roles,
    })
  }
}
