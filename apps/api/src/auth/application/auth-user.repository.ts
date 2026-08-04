import type {
  AuthUser,
  CreateAuthUserData,
} from '../domain/auth.types'

export interface AuthUserRepository {
  create(
    data: CreateAuthUserData,
  ): Promise<AuthUser>

  findById(
    id: string,
  ): Promise<AuthUser | null>

  findByUsername(
    username: string,
  ): Promise<AuthUser | null>
}
