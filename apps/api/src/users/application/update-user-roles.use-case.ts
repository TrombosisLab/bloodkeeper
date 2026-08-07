import {
  UserAdministrationUserNotFoundError,
} from './update-user.use-case'

import type {
  UserAdministrationRepository,
} from './user-administration.repository'

import {
  normalizeUserAdministrationRoles,
} from '../domain/user-administration.rules'

import type {
  UpdateUserRolesInput,
  UserAdministrationRecord,
} from '../domain/user-administration.types'

export class UpdateUserRolesUseCase {
  constructor(
    private readonly users:
      UserAdministrationRepository,
  ) {}

  async execute(
    input: UpdateUserRolesInput,
  ): Promise<UserAdministrationRecord> {
    const current =
      await this.users.findById(
        input.userId,
      )

    if (current === null) {
      throw new UserAdministrationUserNotFoundError()
    }

    const roles =
      normalizeUserAdministrationRoles(
        input.roles,
      )

    return this.users.updateRoles(
      current.id,
      roles,
    )
  }
}
