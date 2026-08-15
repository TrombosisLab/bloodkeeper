import type {
  OffsetPage,
  OffsetPaginationQuery,
} from '../../common/offset-pagination'

import type {
  UserRole,
} from '../../auth/domain/auth.types'

import type {
  CreateUserAdministrationData,
  UpdateUserAdministrationData,
  UserAdministrationRecord,
} from '../domain/user-administration.types'

export const USER_ADMINISTRATION_REPOSITORY =
  Symbol('USER_ADMINISTRATION_REPOSITORY')

export interface UserAdministrationRepository {
  create(
    data: CreateUserAdministrationData,
  ): Promise<UserAdministrationRecord>

  findById(
    userId: string,
  ): Promise<UserAdministrationRecord | null>

  findByUsername(
    username: string,
  ): Promise<UserAdministrationRecord | null>

  list(): Promise<
    readonly UserAdministrationRecord[]
  >

  list(
    query: OffsetPaginationQuery,
  ): Promise<
    OffsetPage<UserAdministrationRecord>
  >

  update(
    userId: string,
    data: UpdateUserAdministrationData,
  ): Promise<UserAdministrationRecord>

  updateRoles(
    userId: string,
    roles: readonly UserRole[],
  ): Promise<UserAdministrationRecord>
}
