import assert from 'node:assert/strict'
import test from 'node:test'

import {
  InvalidLoginPayloadError,
  parseLoginPayload,
} from '../dist/auth/presentation/auth.dto.js'

import {
  readSessionCookie,
} from '../dist/auth/presentation/auth-cookie.js'

test(
  '015-B acepta credenciales estructuradas sin modificar la contraseña',
  () => {
    assert.deepEqual(
      parseLoginPayload({
        username: ' Narrador ',
        password:
          ' contraseña con espacios ',
      }),
      {
        username: ' Narrador ',
        password:
          ' contraseña con espacios ',
      },
    )
  },
)

test(
  '015-B rechaza cuerpos incompletos sin exponer credenciales',
  () => {
    for (const payload of [
      null,
      {},
      {
        username: '',
        password: 'clave',
      },
      {
        username: 'usuario',
        password: '',
      },
      {
        username: 123,
        password: 'clave',
      },
    ]) {
      assert.throws(
        () =>
          parseLoginPayload(
            payload,
          ),
        InvalidLoginPayloadError,
      )
    }
  },
)

test(
  '015-B extrae exclusivamente la cookie de sesión',
  () => {
    assert.equal(
      readSessionCookie(
        'theme=dark; bk_session=abc_123; other=value',
      ),
      'abc_123',
    )

    assert.equal(
      readSessionCookie(
        'theme=dark',
      ),
      null,
    )

    assert.equal(
      readSessionCookie(undefined),
      null,
    )
  },
)
