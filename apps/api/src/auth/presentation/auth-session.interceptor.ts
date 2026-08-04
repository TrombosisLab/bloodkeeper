import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'

import type {
  Observable,
} from 'rxjs'

import {
  ResolveSessionUseCase,
} from '../application/resolve-session.use-case'

import {
  clearSessionCookie,
  isSecureRequest,
  readSessionCookie,
} from './auth-cookie'

import type {
  AuthCookieResponse,
  AuthHttpRequest,
} from './auth-http.types'

@Injectable()
export class AuthSessionInterceptor
  implements NestInterceptor {
  constructor(
    private readonly resolveSession:
      ResolveSessionUseCase,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    if (context.getType() !== 'http') {
      return next.handle()
    }

    const http =
      context.switchToHttp()

    const request =
      http.getRequest<AuthHttpRequest>()

    const response =
      http.getResponse<AuthCookieResponse>()

    const rawToken =
      readSessionCookie(
        request.headers.cookie,
      )

    if (rawToken === null) {
      return next.handle()
    }

    request.authSessionToken =
      rawToken

    const user =
      await this.resolveSession.execute(
        rawToken,
      )

    if (user === null) {
      clearSessionCookie(
        response,
        isSecureRequest(request),
      )

      return next.handle()
    }

    request.user = user

    return next.handle()
  }
}
