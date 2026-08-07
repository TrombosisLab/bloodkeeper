import assert from 'node:assert/strict'
import {
  readFile,
} from 'node:fs/promises'
import test from 'node:test'

const api =
  await readFile(
    new URL(
      '../src/features/authentication/infrastructure/auth.api.ts',
      import.meta.url,
    ),
    'utf8',
  )

const gate =
  await readFile(
    new URL(
      '../src/features/authentication/components/AuthenticationGate.tsx',
      import.meta.url,
    ),
    'utf8',
  )

test(
  '016-C registra mediante el endpoint público dedicado',
  () => {
    assert.match(
      api,
      /async register\(/,
    )
    assert.match(
      api,
      /'\/api\/users\/register'/,
    )
    assert.match(
      api,
      /credentials:\s*'include'/,
    )
  },
)

test(
  '016-C ofrece Crear cuenta desde el login',
  () => {
    assert.match(
      gate,
      /'Crear cuenta'/,
    )
    assert.match(
      gate,
      /Nombre visible/,
    )
    assert.match(
      gate,
      /authenticationApi\.register/,
    )
    assert.match(
      gate,
      /displayName/,
    )
  },
)

test(
  '016-C vuelve al login tras registrar sin auto-login',
  () => {
    const start =
      gate.indexOf(
        'const handleRegister',
      )
    const end =
      gate.indexOf(
        'const switchMode',
        start,
      )
    const registration =
      gate.slice(start, end)

    assert.match(
      registration,
      /setMode\('login'\)/,
    )
    assert.match(
      registration,
      /Cuenta creada\. Ya puedes iniciar sesión\./,
    )
    assert.doesNotMatch(
      registration,
      /kind:\s*'authenticated'/,
    )
    assert.doesNotMatch(
      registration,
      /authenticationApi\.login/,
    )
  },
)
