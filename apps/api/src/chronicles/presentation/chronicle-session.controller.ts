import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common'

import {
  parseOffsetPaginationQuery,
} from '../../common/offset-pagination'
import {
  ArchiveChronicleSessionUseCase,
} from '../application/archive-chronicle-session.use-case'
import {
  CompleteChronicleSessionUseCase,
} from '../application/complete-chronicle-session.use-case'
import {
  CreateChronicleSessionUseCase,
} from '../application/create-chronicle-session.use-case'
import {
  ListChronicleSessionsUseCase,
} from '../application/list-chronicle-sessions.use-case'
import {
  LoadChronicleSessionUseCase,
} from '../application/load-chronicle-session.use-case'
import {
  ChronicleSessionPermissionError,
} from '../application/chronicle-session-permission'
import {
  ChronicleSessionNotFoundError,
  UpdateChronicleSessionUseCase,
} from '../application/update-chronicle-session.use-case'
import {
  InvalidChronicleSessionRequestError,
  parseChronicleSessionIdParam,
  parseCreateChronicleSessionRequest,
  parseUpdateChronicleSessionRequest,
  toChronicleSessionResponse,
} from './chronicle-session.dto'
import {
  InvalidChronicleRequestError,
  parseChronicleIdParam,
  parseChronicleNarratorId,
} from './chronicle.dto'
import type {
  ChronicleSessionResponseDto,
} from './chronicle-session.dto'

interface AuthenticatedChronicleSessionRequest {
  readonly user?: {
    readonly id?: unknown
  }
}

function authenticatedUserId(
  request: AuthenticatedChronicleSessionRequest,
): string {
  try {
    return parseChronicleNarratorId(
      request.user?.id,
    )
  } catch {
    throw new UnauthorizedException({
      code: 'AUTHENTICATION_REQUIRED',
    })
  }
}

function throwChronicleSessionHttpError(
  error: unknown,
): never {
  if (
    error instanceof
      InvalidChronicleRequestError ||
    error instanceof
      InvalidChronicleSessionRequestError
  ) {
    throw new BadRequestException({
      code:
        'INVALID_CHRONICLE_SESSION_REQUEST',
      message: error.message,
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
  'chronicles/:chronicleId/sessions',
)
export class ChronicleSessionController {
  constructor(
    private readonly listSessions:
      ListChronicleSessionsUseCase,
    private readonly loadSession:
      LoadChronicleSessionUseCase,
    private readonly createSession:
      CreateChronicleSessionUseCase,
    private readonly updateSession:
      UpdateChronicleSessionUseCase,
    private readonly completeSession:
      CompleteChronicleSessionUseCase,
    private readonly archiveSession:
      ArchiveChronicleSessionUseCase,
  ) {}

  @Get()
  async list(
    @Req() request:
      AuthenticatedChronicleSessionRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Query() queryInput?:
      Record<string, unknown>,
  ) {
    const actorUserId =
      authenticatedUserId(request)

    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )

      let query

      try {
        query =
          parseOffsetPaginationQuery({
            limit:
              queryInput?.limit,
            offset:
              queryInput?.offset,
          })
      } catch (error: unknown) {
        throw new BadRequestException({
          code:
            'INVALID_PAGINATION_QUERY',
          message:
            error instanceof Error
              ? error.message
              : 'Invalid pagination query',
        })
      }

      const page =
        await this.listSessions.execute(
          actorUserId,
          chronicleId,
          query,
        )

      return {
        items: page.items.map(
          toChronicleSessionResponse,
        ),
        nextOffset:
          page.nextOffset,
      }
    } catch (error: unknown) {
      throwChronicleSessionHttpError(error)
    }
  }

  @Post()
  async create(
    @Req() request:
      AuthenticatedChronicleSessionRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Body() body: unknown,
  ): Promise<ChronicleSessionResponseDto> {
    const actorUserId =
      authenticatedUserId(request)

    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )
      const data =
        parseCreateChronicleSessionRequest(
          chronicleId,
          body,
        )

      return toChronicleSessionResponse(
        await this.createSession.execute(
          actorUserId,
          data,
        ),
      )
    } catch (error: unknown) {
      throwChronicleSessionHttpError(error)
    }
  }

  @Get(':sessionId')
  async detail(
    @Req() request:
      AuthenticatedChronicleSessionRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('sessionId')
    sessionIdInput: unknown,
  ): Promise<ChronicleSessionResponseDto> {
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
      const session =
        await this.loadSession.execute(
          actorUserId,
          chronicleId,
          sessionId,
        )

      if (session === null) {
        throw new ChronicleSessionNotFoundError(
          sessionId,
        )
      }

      return toChronicleSessionResponse(
        session,
      )
    } catch (error: unknown) {
      throwChronicleSessionHttpError(error)
    }
  }

  @Patch(':sessionId')
  async update(
    @Req() request:
      AuthenticatedChronicleSessionRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('sessionId')
    sessionIdInput: unknown,
    @Body() body: unknown,
  ): Promise<ChronicleSessionResponseDto> {
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
        parseUpdateChronicleSessionRequest(
          chronicleId,
          sessionId,
          body,
        )

      return toChronicleSessionResponse(
        await this.updateSession.execute(
          actorUserId,
          data,
        ),
      )
    } catch (error: unknown) {
      throwChronicleSessionHttpError(error)
    }
  }

  @Patch(':sessionId/complete')
  async complete(
    @Req() request:
      AuthenticatedChronicleSessionRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('sessionId')
    sessionIdInput: unknown,
  ): Promise<ChronicleSessionResponseDto> {
    return this.transition(
      request,
      chronicleIdInput,
      sessionIdInput,
      'complete',
    )
  }

  @Patch(':sessionId/archive')
  async archive(
    @Req() request:
      AuthenticatedChronicleSessionRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('sessionId')
    sessionIdInput: unknown,
  ): Promise<ChronicleSessionResponseDto> {
    return this.transition(
      request,
      chronicleIdInput,
      sessionIdInput,
      'archive',
    )
  }

  private async transition(
    request:
      AuthenticatedChronicleSessionRequest,
    chronicleIdInput: unknown,
    sessionIdInput: unknown,
    action: 'complete' | 'archive',
  ): Promise<ChronicleSessionResponseDto> {
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
      const useCase =
        action === 'complete'
          ? this.completeSession
          : this.archiveSession

      return toChronicleSessionResponse(
        await useCase.execute(
          actorUserId,
          chronicleId,
          sessionId,
        ),
      )
    } catch (error: unknown) {
      throwChronicleSessionHttpError(error)
    }
  }
}
