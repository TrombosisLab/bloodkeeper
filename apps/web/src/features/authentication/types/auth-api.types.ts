export type AuthenticatedRole =
  | 'admin'
  | 'narrator'
  | 'player'

export interface AuthenticatedUserResponse {
  readonly id: string
  readonly username: string
  readonly displayName: string
  readonly roles:
    readonly AuthenticatedRole[]
}

export interface AuthSessionResponse {
  readonly user:
    AuthenticatedUserResponse
}

export interface LoginResponse
  extends AuthSessionResponse {
  readonly expiresAt: string
}

export interface LoginRequest {
  readonly username: string
  readonly password: string
}

export interface RegisterRequest {
  readonly username: string
  readonly displayName: string
  readonly password: string
}

export interface RegisterResponse {
  readonly username: string
  readonly displayName: string
}
