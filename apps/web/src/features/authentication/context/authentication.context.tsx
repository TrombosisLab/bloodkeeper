import {
  createContext,
  useContext,
} from 'react'

import type {
  ReactNode,
} from 'react'

import type {
  AuthenticatedUserResponse,
} from '../types/auth-api.types'

const AuthenticationContext =
  createContext<
    AuthenticatedUserResponse | null
  >(null)

interface AuthenticationProviderProps {
  readonly user:
    AuthenticatedUserResponse
  readonly children: ReactNode
}

export function AuthenticationProvider({
  user,
  children,
}: AuthenticationProviderProps) {
  return (
    <AuthenticationContext.Provider
      value={user}
    >
      {children}
    </AuthenticationContext.Provider>
  )
}

export function useAuthenticatedUser():
  AuthenticatedUserResponse {
  const user =
    useContext(AuthenticationContext)

  if (user === null) {
    throw new Error(
      'Authentication context is unavailable',
    )
  }

  return user
}
