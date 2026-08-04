import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AuthenticationApiError,
  createAuthenticationApi,
} from '../src/features/authentication/infrastructure/auth.api.ts'

function jsonResponse(
  body,
  status = 200,
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        'Content-Type':
          'application/json',
      },
    },
  )
}

test(
  '015-B consulta la sesión usando la cookie del navegador',
  async () => {
    const calls = []

    const api =
      createAuthenticationApi(
        async (input, init) => {
          calls.push([
            input,
            init,
          ])

          return jsonResponse({
            user: {
              id: 'user-id',
              username: 'narrador',
              displayName:
                'Narrador',
              roles: [
                'narrator',
              ],
            },
          })
        },
      )

    const session =
      await api.loadSession()

    assert.equal(
      session?.user.username,
      'narrador',
    )
    assert.equal(
      calls[0][0],
      '/api/auth/session',
    )
    assert.equal(
      calls[0][1].credentials,
      'include',
    )
  },
)

test(
  '015-B trata 401 de sesión como usuario anónimo',
  async () => {
    const api =
      createAuthenticationApi(
        async () =>
          jsonResponse(
            {
              code:
                'AUTHENTICATION_REQUIRED',
            },
            401,
          ),
      )

    assert.equal(
      await api.loadSession(),
      null,
    )
  },
)

test(
  '015-B envía login y logout con credenciales incluidas',
  async () => {
    const calls = []

    const api =
      createAuthenticationApi(
        async (input, init) => {
          calls.push([
            input,
            init,
          ])

          if (
            input ===
              '/api/auth/login'
          ) {
            return jsonResponse({
              user: {
                id: 'user-id',
                username:
                  'narrador',
                displayName:
                  'Narrador',
                roles: [
                  'narrator',
                ],
              },
              expiresAt:
                '2026-08-05T06:00:00.000Z',
            })
          }

          return new Response(
            null,
            {
              status: 204,
            },
          )
        },
      )

    await api.login({
      username: 'narrador',
      password:
        'contraseña-segura',
    })

    await api.logout()

    assert.equal(
      calls[0][0],
      '/api/auth/login',
    )
    assert.equal(
      calls[0][1].method,
      'POST',
    )
    assert.equal(
      calls[0][1].credentials,
      'include',
    )
    assert.equal(
      calls[1][0],
      '/api/auth/logout',
    )
    assert.equal(
      calls[1][1].credentials,
      'include',
    )
  },
)

test(
  '015-B conserva estado código y mensaje de errores de login',
  async () => {
    const api =
      createAuthenticationApi(
        async () =>
          jsonResponse(
            {
              code:
                'INVALID_CREDENTIALS',
              message:
                'Credenciales inválidas.',
            },
            401,
          ),
      )

    await assert.rejects(
      api.login({
        username: 'narrador',
        password: 'incorrecta',
      }),
      (error) =>
        error instanceof
          AuthenticationApiError &&
        error.status === 401 &&
        error.code ===
          'INVALID_CREDENTIALS',
    )
  },
)
