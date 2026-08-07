import type {
  CreateUserAdministrationData,
  UserAdministrationRecord,
} from '../domain/user-administration.types'

export const USER_ADMINISTRATION_REPOSITORY =
  Symbol('USER_ADMINISTRATION_REPOSITORY')

export interface UserAdministrationRepository {
  create(
    data: CreateUserAdministrationData,
  ): Promise<UserAdministrationRecord>

  findByUsername(
    username: string,
  ): Promise<UserAdministrationRecord | null>

  list(): Promise<
    readonly UserAdministrationRecord[]
  >
}
