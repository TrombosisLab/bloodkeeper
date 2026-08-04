import {
  FormEvent,
  ReactNode,
  useEffect,
  useState,
} from 'react'

import {
  AuthenticationProvider,
} from '../context/authentication.context'

import {
  AuthenticationApiError,
  authenticationApi,
} from '../infrastructure/auth.api'

import type {
  AuthenticatedUserResponse,
} from '../types/auth-api.types'

import './authentication-gate.css'

interface AuthenticationGateProps {
  readonly children: ReactNode
}

type AuthenticationState =
  | {
      readonly kind: 'loading'
    }
  | {
      readonly kind: 'anonymous'
      readonly message: string | null
    }
  | {
      readonly kind: 'authenticated'
      readonly user:
        AuthenticatedUserResponse
    }
  | {
      readonly kind: 'error'
      readonly message: string
    }

function readableError(
  error: unknown,
): string {
  if (
    error instanceof
      AuthenticationApiError
  ) {
    return error.message
  }

  return (
    'No se pudo conectar con el sistema de autenticación.'
  )
}

export function AuthenticationGate({
  children,
}: AuthenticationGateProps) {
  const [state, setState] =
    useState<AuthenticationState>({
      kind: 'loading',
    })

  const [username, setUsername] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [submitting, setSubmitting] =
    useState(false)

  const loadSession = async () => {
    setState({
      kind: 'loading',
    })

    try {
      const session =
        await authenticationApi.loadSession()

      setState(
        session === null
          ? {
              kind: 'anonymous',
              message: null,
            }
          : {
              kind: 'authenticated',
              user: session.user,
            },
      )
    } catch (error: unknown) {
      setState({
        kind: 'error',
        message:
          readableError(error),
      })
    }
  }

  useEffect(() => {
    void loadSession()
  }, [])

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      const session =
        await authenticationApi.login({
          username,
          password,
        })

      setPassword('')
      setState({
        kind: 'authenticated',
        user: session.user,
      })
    } catch (error: unknown) {
      setState({
        kind: 'anonymous',
        message:
          readableError(error),
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    setSubmitting(true)

    try {
      await authenticationApi.logout()
      setPassword('')
      setState({
        kind: 'anonymous',
        message: null,
      })
    } catch (error: unknown) {
      setState({
        kind: 'error',
        message:
          readableError(error),
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (state.kind === 'loading') {
    return (
      <main className="authentication-shell">
        <section
          className="authentication-card"
          aria-live="polite"
        >
          <span className="authentication-card__eyebrow">
            BloodKeeper
          </span>
          <h1>Comprobando sesión</h1>
          <p>
            Verificando el acceso local…
          </p>
        </section>
      </main>
    )
  }

  if (state.kind === 'error') {
    return (
      <main className="authentication-shell">
        <section
          className="authentication-card"
          role="alert"
        >
          <span className="authentication-card__eyebrow">
            BloodKeeper
          </span>
          <h1>Autenticación no disponible</h1>
          <p>{state.message}</p>
          <button
            type="button"
            onClick={() =>
              void loadSession()
            }
          >
            Reintentar
          </button>
        </section>
      </main>
    )
  }

  if (state.kind === 'anonymous') {
    return (
      <main className="authentication-shell">
        <form
          className="authentication-card"
          onSubmit={handleLogin}
        >
          <span className="authentication-card__eyebrow">
            BloodKeeper
          </span>
          <h1>Iniciar sesión</h1>
          <p>
            Acceso local a Vampiro V5 Revolution.
          </p>

          <label>
            Usuario
            <input
              name="username"
              autoComplete="username"
              required
              maxLength={64}
              value={username}
              onChange={(event) =>
                setUsername(
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Contraseña
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={200}
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value,
                )
              }
            />
          </label>

          {state.message !== null ? (
            <p
              className="authentication-card__error"
              role="alert"
            >
              {state.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? 'Accediendo…'
              : 'Entrar'}
          </button>
        </form>
      </main>
    )
  }

  return (
    <AuthenticationProvider
      user={state.user}
    >
      <aside
        className="authentication-session"
        aria-label="Sesión actual"
      >
        <span>
          <strong>
            {state.user.displayName}
          </strong>
          <small>
            @{state.user.username}
          </small>
        </span>

        <button
          type="button"
          disabled={submitting}
          onClick={() =>
            void handleLogout()
          }
        >
          Cerrar sesión
        </button>
      </aside>

      {children}
    </AuthenticationProvider>
  )
}
