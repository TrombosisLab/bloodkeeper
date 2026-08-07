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

type AuthenticationMode =
  | 'login'
  | 'register'

type AuthenticationFeedback =
  | {
      readonly kind: 'error' | 'success'
      readonly message: string
    }
  | null

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

  const [mode, setMode] =
    useState<AuthenticationMode>('login')

  const [username, setUsername] =
    useState('')

  const [displayName, setDisplayName] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [feedback, setFeedback] =
    useState<AuthenticationFeedback>(null)

  const [submitting, setSubmitting] =
    useState(false)

  const loadSession = async () => {
    setState({
      kind: 'loading',
    })
    setFeedback(null)

    try {
      const session =
        await authenticationApi.loadSession()

      setState(
        session === null
          ? {
              kind: 'anonymous',
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
    setFeedback(null)

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
      })
      setFeedback({
        kind: 'error',
        message: readableError(error),
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegister = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()
    setSubmitting(true)
    setFeedback(null)

    try {
      const registered =
        await authenticationApi.register({
          username,
          displayName,
          password,
        })

      setUsername(registered.username)
      setDisplayName('')
      setPassword('')
      setMode('login')
      setState({
        kind: 'anonymous',
      })
      setFeedback({
        kind: 'success',
        message:
          'Cuenta creada. Ya puedes iniciar sesión.',
      })
    } catch (error: unknown) {
      setState({
        kind: 'anonymous',
      })
      setFeedback({
        kind: 'error',
        message: readableError(error),
      })
    } finally {
      setSubmitting(false)
    }
  }

  const switchMode = (
    nextMode: AuthenticationMode,
  ) => {
    setMode(nextMode)
    setPassword('')
    setFeedback(null)
  }

  const handleLogout = async () => {
    setSubmitting(true)

    try {
      await authenticationApi.logout()
      setPassword('')
      setFeedback(null)
      setMode('login')
      setState({
        kind: 'anonymous',
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
          data-view-state="loading"
          role="status"
          aria-live="polite"
          aria-busy="true"
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
          data-view-state="error"
          role="alert"
          aria-live="assertive"
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
    const registering =
      mode === 'register'

    return (
      <main className="authentication-shell">
        <form
          className="authentication-card"
          data-view-state="permission"
          aria-busy={submitting}
          onSubmit={
            registering
              ? handleRegister
              : handleLogin
          }
        >
          <span className="authentication-card__eyebrow">
            BloodKeeper
          </span>

          <h1>
            {registering
              ? 'Crear cuenta'
              : 'Iniciar sesión'}
          </h1>

          <p>
            {registering
              ? 'Crea una cuenta local de jugador.'
              : 'Acceso local a Vampiro V5 Revolution.'}
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

          {registering ? (
            <label>
              Nombre visible
              <input
                name="displayName"
                autoComplete="name"
                required
                maxLength={80}
                value={displayName}
                onChange={(event) =>
                  setDisplayName(
                    event.target.value,
                  )
                }
              />
            </label>
          ) : null}

          {registering ? (
            <label>
              Contraseña
              <input
                name="password"
                type="password"
                autoComplete="new-password"
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
          ) : (
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
          )}

          {feedback !== null ? (
            <p
              className={
                feedback.kind === 'error'
                  ? 'authentication-card__error'
                  : undefined
              }
              role={
                feedback.kind === 'error'
                  ? 'alert'
                  : 'status'
              }
            >
              {feedback.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
          >
            {submitting
              ? registering
                ? 'Creando cuenta…'
                : 'Accediendo…'
              : registering
                ? 'Crear cuenta'
                : 'Entrar'}
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() =>
              switchMode(
                registering
                  ? 'login'
                  : 'register',
              )
            }
          >
            {registering
              ? 'Volver a iniciar sesión'
              : 'Crear cuenta'}
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
