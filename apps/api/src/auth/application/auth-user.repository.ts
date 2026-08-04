import type {
  AuthUser,
  CreateAuthUserData,
} from '../domain/auth.types'

export interface AuthUserRepository {
  create(
    data: CreateAuthUserData,
  ): Promise<AuthUser>

  findByUsername(
    username: string,
  ): Promise<AuthUser | null>
}
