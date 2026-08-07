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

  update(
    userId: string,
    data: UpdateUserAdministrationData,
  ): Promise<UserAdministrationRecord>
}
