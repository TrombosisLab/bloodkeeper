import type {
  AuthSessionResponse,
  AuthenticatedRole,
  AuthenticatedUserResponse,
  LoginRequest,
  LoginResponse,
} from '../types/auth-api.types'

export class AuthenticationApiError
  extends Error {
  readonly status: number
  readonly code: string | null

  constructor(
    status: number,
    message: string,
    code: string | null,
  ) {
    super(message)
    this.name =
      'AuthenticationApiError'
    this.status = status
    this.code = code
  }
}

type FetchLike = (
  input: string,
  init?: RequestInit,
) => Promise<Response>

const roles =
  new Set<AuthenticatedRole>([
    'admin',
    'narrator',
    'player',
  ])

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

function parseUser(
  value: unknown,
): AuthenticatedUserResponse {
  if (!isRecord(value)) {
    throw new Error(
      'Respuesta de usuario inválida',
    )
  }

  const rawRoles = value.roles

  if (
    typeof value.id !== 'string' ||
    typeof value.username !== 'string' ||
    typeof value.displayName !==
      'string' ||
    !Array.isArray(rawRoles) ||
    !rawRoles.every(
      (role): role is AuthenticatedRole =>
        typeof role === 'string' &&
        roles.has(
          role as AuthenticatedRole,
        ),
    )
  ) {
    throw new Error(
      'Respuesta de usuario inválida',
    )
  }

  return {
    id: value.id,
    username: value.username,
    displayName:
      value.displayName,
    roles: [...rawRoles],
  }
}

function parseSession(
  value: unknown,
): AuthSessionResponse {
  if (!isRecord(value)) {
    throw new Error(
      'Respuesta de sesión inválida',
    )
  }

  return {
    user: parseUser(value.user),
  }
}

function parseLogin(
  value: unknown,
): LoginResponse {
  if (
    !isRecord(value) ||
    typeof value.expiresAt !==
      'string'
  ) {
    throw new Error(
      'Respuesta de login inválida',
    )
  }

  return {
    ...parseSession(value),
    expiresAt: value.expiresAt,
  }
}

async function parseError(
  response: Response,
): Promise<AuthenticationApiError> {
  let message =
    'No se pudo completar la autenticación.'
  let code: string | null = null

  try {
    const body =
      await response.json()

    if (isRecord(body)) {
      if (
        typeof body.message === 'string'
      ) {
        message = body.message
      }

      if (
        typeof body.code === 'string'
      ) {
        code = body.code
      }
    }
  } catch {
    // El estado HTTP sigue siendo fiable.
  }

  return new AuthenticationApiError(
    response.status,
    message,
    code,
  )
}

export function createAuthenticationApi(
  fetcher: FetchLike = fetch,
) {
  return {
    async loadSession():
      Promise<AuthSessionResponse | null> {
      const response =
        await fetcher(
          '/api/auth/session',
          {
            credentials: 'include',
          },
        )

      if (response.status === 401) {
        return null
      }

      if (!response.ok) {
        throw await parseError(
          response,
        )
      }

      return parseSession(
        await response.json(),
      )
    },

    async login(
      input: LoginRequest,
    ): Promise<LoginResponse> {
      const response =
        await fetcher(
          '/api/auth/login',
          {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify(input),
          },
        )

      if (!response.ok) {
        throw await parseError(
          response,
        )
      }

      return parseLogin(
        await response.json(),
      )
    },

    async logout(): Promise<void> {
      const response =
        await fetcher(
          '/api/auth/logout',
          {
            method: 'POST',
            credentials: 'include',
          },
        )

      if (!response.ok) {
        throw await parseError(
          response,
        )
      }
    },
  }
}

export const authenticationApi =
  createAuthenticationApi()
