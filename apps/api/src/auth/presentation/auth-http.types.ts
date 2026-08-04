import type {
  AuthenticatedUser,
} from '../domain/auth.types'

export interface AuthHttpRequest {
  readonly headers: Record<
    string,
    string | string[] | undefined
  >
  readonly secure?: boolean
  user?: AuthenticatedUser
  authSessionToken?: string
}

export interface AuthCookieResponse {
  cookie(
    name: string,
    value: string,
    options: {
      readonly httpOnly: boolean
      readonly sameSite: 'strict'
      readonly secure: boolean
      readonly path: '/'
      readonly expires: Date
      readonly maxAge: number
    },
  ): void

  clearCookie(
    name: string,
    options: {
      readonly httpOnly: boolean
      readonly sameSite: 'strict'
      readonly secure: boolean
      readonly path: '/'
    },
  ): void
}
