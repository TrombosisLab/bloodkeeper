import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common'

import {
  InvalidCredentialsError,
  LoginUseCase,
} from '../application/login.use-case'

import {
  LogoutUseCase,
} from '../application/logout.use-case'

import {
  clearSessionCookie,
  isSecureRequest,
  setSessionCookie,
} from './auth-cookie'

import {
  InvalidLoginPayloadError,
  parseLoginPayload,
} from './auth.dto'

import type {
  AuthCookieResponse,
  AuthHttpRequest,
} from './auth-http.types'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase:
      LoginUseCase,
    private readonly logoutUseCase:
      LogoutUseCase,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: unknown,
    @Req() request:
      AuthHttpRequest,
    @Res({ passthrough: true })
    response: AuthCookieResponse,
  ): Promise<{
    readonly user: NonNullable<
      AuthHttpRequest['user']
    >
    readonly expiresAt: string
  }> {
    let credentials

    try {
      credentials =
        parseLoginPayload(body)
    } catch (
      error: unknown
    ) {
      if (
        error instanceof
          InvalidLoginPayloadError
      ) {
        throw new BadRequestException({
          code:
            'AUTH_LOGIN_PAYLOAD_INVALID',
          message:
            'Introduce un usuario y una contraseña válidos.',
        })
      }

      throw error
    }

    try {
      const result =
        await this.loginUseCase.execute(
          credentials,
        )

      setSessionCookie(
        response,
        result.sessionToken,
        result.expiresAt,
        isSecureRequest(request),
      )

      return {
        user: result.user,
        expiresAt:
          result.expiresAt.toISOString(),
      }
    } catch (
      error: unknown
    ) {
      if (
        error instanceof
          InvalidCredentialsError
      ) {
        throw new UnauthorizedException({
          code: 'INVALID_CREDENTIALS',
          message:
            'El usuario o la contraseña no son correctos.',
        })
      }

      throw error
    }
  }

  @Get('session')
  currentSession(
    @Req() request:
      AuthHttpRequest,
  ): {
    readonly user: NonNullable<
      AuthHttpRequest['user']
    >
  } {
    if (request.user === undefined) {
      throw new UnauthorizedException({
        code: 'AUTHENTICATION_REQUIRED',
        message:
          'Necesitas una sesión válida.',
      })
    }

    return {
      user: request.user,
    }
  }

  @Post('logout')
  @HttpCode(204)
  async logout(
    @Req() request:
      AuthHttpRequest,
    @Res({ passthrough: true })
    response: AuthCookieResponse,
  ): Promise<void> {
    if (
      request.authSessionToken !==
        undefined
    ) {
      await this.logoutUseCase.execute(
        request.authSessionToken,
      )
    }

    clearSessionCookie(
      response,
      isSecureRequest(request),
    )
  }
}
