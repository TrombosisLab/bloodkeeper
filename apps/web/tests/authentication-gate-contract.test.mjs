import assert from 'node:assert/strict'
import {
  readFileSync,
} from 'node:fs'
import test from 'node:test'

const gate =
  readFileSync(
    new URL(
      '../src/features/authentication/components/AuthenticationGate.tsx',
      import.meta.url,
    ),
    'utf8',
  )

const main =
  readFileSync(
    new URL(
      '../src/main.tsx',
      import.meta.url,
    ),
    'utf8',
  )

test(
  '015-B protege la aplicación completa mediante AuthenticationGate',
  () => {
    assert.match(
      main,
      /<AuthenticationGate>/,
    )
    assert.match(
      main,
      /<App \/>/,
    )
  },
)

test(
  '015-B presenta login restauración de sesión y logout',
  () => {
    assert.match(
      gate,
      /loadSession/,
    )
    assert.match(
      gate,
      /Iniciar sesión/,
    )
    assert.match(
      gate,
      /Cerrar sesión/,
    )
    assert.match(
      gate,
      /autoComplete="username"/,
    )
    assert.match(
      gate,
      /autoComplete="current-password"/,
    )
  },
)

test(
  '015-B no guarda credenciales ni tokens en almacenamiento web',
  () => {
    assert.doesNotMatch(
      gate,
      /localStorage|sessionStorage/,
    )
    assert.doesNotMatch(
      gate,
      /token/i,
    )
  },
)
