export interface IssuedSessionToken {
  readonly rawToken: string
  readonly tokenHash: string
}

export interface SessionTokenService {
  issue(): IssuedSessionToken

  hash(rawToken: string): string
}
