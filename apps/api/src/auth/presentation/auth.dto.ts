import type {
  LoginCredentials,
} from '../domain/auth-session.types'

export class InvalidLoginPayloadError
  extends Error {
  constructor() {
    super('Invalid login payload')
    this.name = 'InvalidLoginPayloadError'
  }
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  )
}

export function parseLoginPayload(
  input: unknown,
): LoginCredentials {
  if (!isRecord(input)) {
    throw new InvalidLoginPayloadError()
  }

  const username = input.username
  const password = input.password

  if (
    typeof username !== 'string' ||
    username.trim().length === 0 ||
    username.length > 64 ||
    typeof password !== 'string' ||
    password.length === 0 ||
    password.length > 200
  ) {
    throw new InvalidLoginPayloadError()
  }

  return {
    username,
    password,
  }
}
