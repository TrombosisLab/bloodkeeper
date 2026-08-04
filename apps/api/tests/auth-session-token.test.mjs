import assert from 'node:assert/strict'
import test from 'node:test'

import {
  Sha256SessionTokenService,
} from '../dist/auth/infrastructure/sha256-session-token.service.js'

test(
  '015-B genera tokens de sesión impredecibles y hashes estables',
  () => {
    const service =
      new Sha256SessionTokenService()

    const first = service.issue()
    const second = service.issue()

    assert.notEqual(
      first.rawToken,
      second.rawToken,
    )
    assert.notEqual(
      first.tokenHash,
      second.tokenHash,
    )
    assert.equal(
      first.tokenHash,
      service.hash(first.rawToken),
    )
    assert.match(
      first.rawToken,
      /^[A-Za-z0-9_-]{43}$/,
    )
    assert.match(
      first.tokenHash,
      /^[a-f0-9]{64}$/,
    )
  },
)
