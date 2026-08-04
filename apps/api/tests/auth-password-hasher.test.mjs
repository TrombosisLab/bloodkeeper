import assert from 'node:assert/strict'
import test from 'node:test'

import {
  ScryptPasswordHasher,
} from '../dist/auth/infrastructure/scrypt-password-hasher.js'

test(
  '015-A genera hashes salados y no reversibles',
  async () => {
    const hasher =
      new ScryptPasswordHasher()
    const first =
      await hasher.hash(
        'una-contraseña-segura',
      )
    const second =
      await hasher.hash(
        'una-contraseña-segura',
      )

    assert.match(first, /^scrypt\$/)
    assert.notEqual(
      first,
      'una-contraseña-segura',
    )
    assert.notEqual(first, second)
  },
)

test(
  '015-A verifica la contraseña correcta',
  async () => {
    const hasher =
      new ScryptPasswordHasher()
    const encoded =
      await hasher.hash(
        'una-contraseña-segura',
      )

    assert.equal(
      await hasher.verify(
        'una-contraseña-segura',
        encoded,
      ),
      true,
    )
    assert.equal(
      await hasher.verify(
        'contraseña-incorrecta',
        encoded,
      ),
      false,
    )
  },
)

test(
  '015-A rechaza hashes manipulados o desconocidos',
  async () => {
    const hasher =
      new ScryptPasswordHasher()

    assert.equal(
      await hasher.verify(
        'cualquier-cosa',
        'plaintext$password',
      ),
      false,
    )
    assert.equal(
      await hasher.verify(
        'cualquier-cosa',
        'scrypt$bad$data',
      ),
      false,
    )
  },
)
