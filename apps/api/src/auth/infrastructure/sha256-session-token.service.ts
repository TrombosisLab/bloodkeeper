import {
  createHash,
  randomBytes,
} from 'node:crypto'

import type {
  IssuedSessionToken,
  SessionTokenService,
} from '../application/session-token.service'

export class Sha256SessionTokenService
  implements SessionTokenService {
  issue(): IssuedSessionToken {
    const rawToken =
      randomBytes(32)
        .toString('base64url')

    return {
      rawToken,
      tokenHash: this.hash(rawToken),
    }
  }

  hash(rawToken: string): string {
    return createHash('sha256')
      .update(rawToken, 'utf8')
      .digest('hex')
  }
}
