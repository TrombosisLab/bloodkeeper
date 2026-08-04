import type {
  AuthCookieResponse,
  AuthHttpRequest,
} from './auth-http.types'

export const AUTH_SESSION_COOKIE =
  'bk_session'

export function readSessionCookie(
  cookieHeader:
    | string
    | string[]
    | undefined,
): string | null {
  const rawHeader =
    Array.isArray(cookieHeader)
      ? cookieHeader.join(';')
      : cookieHeader

  if (
    rawHeader === undefined ||
    rawHeader.trim().length === 0
  ) {
    return null
  }

  for (
    const part of rawHeader.split(';')
  ) {
    const separator =
      part.indexOf('=')

    if (separator < 0) {
      continue
    }

    const name =
      part.slice(0, separator).trim()

    if (name !== AUTH_SESSION_COOKIE) {
      continue
    }

    const value =
      part.slice(separator + 1).trim()

    return value.length === 0
      ? null
      : value
  }

  return null
}

export function isSecureRequest(
  request: AuthHttpRequest,
): boolean {
  if (request.secure === true) {
    return true
  }

  const forwarded =
    request.headers[
      'x-forwarded-proto'
    ]

  const protocol =
    Array.isArray(forwarded)
      ? forwarded[0]
      : forwarded

  return protocol
    ?.split(',')[0]
    ?.trim()
    .toLowerCase() === 'https'
}

export function setSessionCookie(
  response: AuthCookieResponse,
  rawToken: string,
  expiresAt: Date,
  secure: boolean,
  now: Date = new Date(),
): void {
  response.cookie(
    AUTH_SESSION_COOKIE,
    rawToken,
    {
      httpOnly: true,
      sameSite: 'strict',
      secure,
      path: '/',
      expires: expiresAt,
      maxAge: Math.max(
        0,
        expiresAt.getTime() -
          now.getTime(),
      ),
    },
  )
}

export function clearSessionCookie(
  response: AuthCookieResponse,
  secure: boolean,
): void {
  response.clearCookie(
    AUTH_SESSION_COOKIE,
    {
      httpOnly: true,
      sameSite: 'strict',
      secure,
      path: '/',
    },
  )
}
