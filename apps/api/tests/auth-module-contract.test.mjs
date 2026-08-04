import assert from 'node:assert/strict'
import {
  readFileSync,
} from 'node:fs'
import test from 'node:test'

const moduleSource =
  readFileSync(
    new URL(
      '../src/auth/auth.module.ts',
      import.meta.url,
    ),
    'utf8',
  )

const appSource =
  readFileSync(
    new URL(
      '../src/app.module.ts',
      import.meta.url,
    ),
    'utf8',
  )

const interceptorSource =
  readFileSync(
    new URL(
      '../src/auth/presentation/auth-session.interceptor.ts',
      import.meta.url,
    ),
    'utf8',
  )

test(
  '015-B registra autenticación e interceptor de sesión global',
  () => {
    assert.match(
      appSource,
      /AuthModule/,
    )
    assert.match(
      moduleSource,
      /APP_INTERCEPTOR/,
    )
    assert.match(
      moduleSource,
      /AuthSessionInterceptor/,
    )
  },
)

test(
  '015-B el interceptor asigna request.user sólo tras resolver una sesión válida',
  () => {
    assert.match(
      interceptorSource,
      /resolveSession\.execute/,
    )
    assert.match(
      interceptorSource,
      /request\.user = user/,
    )
    assert.match(
      interceptorSource,
      /clearSessionCookie/,
    )
  },
)

test(
  '015-B no usa JWT ni almacena el token bruto',
  () => {
    assert.doesNotMatch(
      moduleSource,
      /jwt|passport/i,
    )
    assert.doesNotMatch(
      interceptorSource,
      /localStorage|sessionStorage/,
    )
  },
)
