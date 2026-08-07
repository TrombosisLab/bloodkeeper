import type {
  AuthSessionRepository,
} from '../../auth/application/auth-session.repository'

import {
  UserAlreadyExistsError,
} from './create-user.use-case'

import type {
  UserAdministrationRepository,
} from './user-administration.repository'

import {
  normalizeUserAdministrationUpdate,
} from '../domain/user-administration.rules'

import type {
  UpdateUserAdministrationInput,
  UserAdministrationRecord,
} from '../domain/user-administration.types'

export class UserAdministrationUserNotFoundError
  extends Error {
  constructor() {
    super('User administration user not found')
    this.name =
      'UserAdministrationUserNotFoundError'
  }
}

export class UpdateUserUseCase {
  constructor(
    private readonly users:
      UserAdministrationRepository,
    private readonly sessions:
      AuthSessionRepository,
    private readonly now:
      () => Date = () => new Date(),
  ) {}

  async execute(
    input: UpdateUserAdministrationInput,
  ): Promise<UserAdministrationRecord> {
    const current =
      await this.users.findById(
        input.userId,
      )

    if (current === null) {
      throw new UserAdministrationUserNotFoundError()
    }

    const normalized =
      normalizeUserAdministrationUpdate({
        username:
          input.username ??
          current.username,
        displayName:
          input.displayName ??
          current.displayName,
        status:
          input.status ??
          current.status,
      })

    if (
      normalized.username !==
      current.username
    ) {
      const existing =
        await this.users.findByUsername(
          normalized.username,
        )

      if (
        existing !== null &&
        existing.id !== current.id
      ) {
        throw new UserAlreadyExistsError()
      }
    }

    const updated =
      await this.users.update(
        current.id,
        normalized,
      )

    if (
      current.status !== 'disabled' &&
      updated.status === 'disabled'
    ) {
      await this.sessions.revokeAllByUserId(
        updated.id,
        this.now(),
      )
    }

    return updated
  }
}
