import type {
  UserAdministrationRepository,
} from './user-administration.repository'

import type {
  UserAdministrationRecord,
} from '../domain/user-administration.types'

export class ListUsersUseCase {
  constructor(
    private readonly users:
      UserAdministrationRepository,
  ) {}

  execute(): Promise<
    readonly UserAdministrationRecord[]
  > {
    return this.users.list()
  }
}
