import {
  AuthRecoveryUserNotFoundError,
  ResetUserPasswordUseCase,
} from '../../auth/application/reset-user-password.use-case'

import type {
  UserAdministrationRepository,
} from './user-administration.repository'

import {
  UserAdministrationUserNotFoundError,
} from './update-user.use-case'

import type {
  ResetUserCredentialsInput,
  UserAdministrationRecord,
} from '../domain/user-administration.types'

export class ResetUserCredentialsUseCase {
  constructor(
    private readonly users:
      UserAdministrationRepository,
    private readonly resetPassword:
      ResetUserPasswordUseCase,
  ) {}

  async execute(
    input: ResetUserCredentialsInput,
  ): Promise<UserAdministrationRecord> {
    const current =
      await this.users.findById(
        input.userId,
      )

    if (current === null) {
      throw new UserAdministrationUserNotFoundError()
    }

    try {
      const updated =
        await this.resetPassword.execute({
          username: current.username,
          password: input.password,
        })

      return {
        id: updated.id,
        username: updated.username,
        displayName: updated.displayName,
        status: updated.status,
        roles: [...updated.roles],
        createdAt:
          new Date(updated.createdAt),
        updatedAt:
          new Date(updated.updatedAt),
      }
    } catch (error: unknown) {
      if (
        error instanceof
          AuthRecoveryUserNotFoundError
      ) {
        throw new UserAdministrationUserNotFoundError()
      }

      throw error
    }
  }
}
