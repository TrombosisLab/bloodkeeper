import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Req,
  UnauthorizedException,
} from '@nestjs/common'

import {
  ChronicleSessionContextNotEditableError,
  ChronicleSessionContextReferenceError,
} from '../application/chronicle-session-context.repository'

import {
  LoadChronicleSessionContextUseCase,
} from '../application/load-chronicle-session-context.use-case'

import {
  ReplaceChronicleSessionContextUseCase,
} from '../application/replace-chronicle-session-context.use-case'

import {
  ChronicleSessionPermissionError,
} from '../application/chronicle-session-permission'

import {
  ChronicleSessionNotFoundError,
} from '../application/update-chronicle-session.use-case'

import {
  InvalidChronicleSessionContextRequestError,
  parseReplaceChronicleSessionContextRequest,
  toChronicleSessionContextResponse,
} from './chronicle-session-context.dto'

import {
  parseChronicleSessionIdParam,
} from './chronicle-session.dto'

import {
  InvalidChronicleRequestError,
  parseChronicleIdParam,
  parseChronicleNarratorId,
} from './chronicle.dto'

import type {
  ChronicleSessionContextResponseDto,
} from './chronicle-session-context.dto'

interface AuthenticatedChronicleSessionContextRequest {
  readonly user?: {
    readonly id?: unknown
  }
}

function authenticatedUserId(
  request:
    AuthenticatedChronicleSessionContextRequest,
): string {
  try {
    return parseChronicleNarratorId(
      request.user?.id,
    )
  } catch {
    throw new UnauthorizedException({
      code:
        'AUTHENTICATION_REQUIRED',
    })
  }
}

function throwChronicleSessionContextHttpError(
  error: unknown,
): never {
  if (
    error instanceof
      InvalidChronicleRequestError ||
    error instanceof
      InvalidChronicleSessionContextRequestError
  ) {
    throw new BadRequestException({
      code:
        'INVALID_CHRONICLE_SESSION_CONTEXT_REQUEST',
      message: error.message,
    })
  }

  if (
    error instanceof
      ChronicleSessionContextReferenceError
  ) {
    throw new BadRequestException({
      code:
        'CHRONICLE_SESSION_CONTEXT_REFERENCE_INVALID',
      resourceKind:
        error.resourceKind,
      resourceId:
        error.resourceId,
    })
  }

  if (
    error instanceof
      ChronicleSessionPermissionError
  ) {
    throw new ForbiddenException({
      code:
        'CHRONICLE_SESSION_PERMISSION_DENIED',
    })
  }

  if (
    error instanceof
      ChronicleSessionContextNotEditableError
  ) {
    throw new ConflictException({
      code:
        'CHRONICLE_SESSION_CONTEXT_NOT_EDITABLE',
    })
  }

  if (
    error instanceof
      ChronicleSessionNotFoundError
  ) {
    throw new NotFoundException({
      code:
        'CHRONICLE_SESSION_NOT_FOUND',
    })
  }

  throw error
}

@Controller(
  'chronicles/:chronicleId/sessions/:sessionId/context',
)
export class ChronicleSessionContextController {
  constructor(
    private readonly loadContext:
      LoadChronicleSessionContextUseCase,
    private readonly replaceContext:
      ReplaceChronicleSessionContextUseCase,
  ) {}

  @Get()
  async load(
    @Req()
    request:
      AuthenticatedChronicleSessionContextRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('sessionId')
    sessionIdInput: unknown,
  ): Promise<ChronicleSessionContextResponseDto> {
    const actorUserId =
      authenticatedUserId(request)

    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )
      const sessionId =
        parseChronicleSessionIdParam(
          sessionIdInput,
        )

      const context =
        await this.loadContext.execute(
          actorUserId,
          chronicleId,
          sessionId,
        )

      if (context === null) {
        throw new ChronicleSessionNotFoundError(
          sessionId,
        )
      }

      return toChronicleSessionContextResponse(
        context,
      )
    } catch (error: unknown) {
      throwChronicleSessionContextHttpError(
        error,
      )
    }
  }

  @Patch()
  async replace(
    @Req()
    request:
      AuthenticatedChronicleSessionContextRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('sessionId')
    sessionIdInput: unknown,
    @Body()
    body: unknown,
  ): Promise<ChronicleSessionContextResponseDto> {
    const actorUserId =
      authenticatedUserId(request)

    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )
      const sessionId =
        parseChronicleSessionIdParam(
          sessionIdInput,
        )

      const data =
        parseReplaceChronicleSessionContextRequest(
          chronicleId,
          sessionId,
          body,
        )

      const context =
        await this.replaceContext.execute(
          actorUserId,
          data,
        )

      if (context === null) {
        throw new ChronicleSessionNotFoundError(
          sessionId,
        )
      }

      return toChronicleSessionContextResponse(
        context,
      )
    } catch (error: unknown) {
      throwChronicleSessionContextHttpError(
        error,
      )
    }
  }
}
