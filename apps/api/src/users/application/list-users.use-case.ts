import type {
  OffsetPage,
  OffsetPaginationQuery,
} from '../../common/offset-pagination'

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
  >

  execute(
    query: OffsetPaginationQuery,
  ): Promise<
    OffsetPage<UserAdministrationRecord>
  >

  execute(
    query?: OffsetPaginationQuery,
  ): Promise<
    | readonly UserAdministrationRecord[]
    | OffsetPage<UserAdministrationRecord>
  > {
    return query === undefined
      ? this.users.list()
      : this.users.list(query)
  }
}
