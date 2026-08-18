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
  UnprocessableEntityException,
} from '@nestjs/common'

import {
  InvalidOffsetPaginationQueryError,
  parseOffsetPaginationQuery,
} from '../../common/offset-pagination'

import {
  AddChronicleSessionAttendanceUseCase,
  ChronicleSessionAttendanceCharacterNotEligibleError,
  ChronicleSessionAttendanceSessionNotEditableError,
  ChronicleSessionAttendanceSessionNotFoundError,
  ListChronicleSessionAttendancesUseCase,
  RemoveChronicleSessionAttendanceUseCase,
} from '../application/chronicle-session-attendance.use-cases'

import {
  ChronicleSessionPermissionError,
} from '../application/chronicle-session-permission'

import {
  InvalidChronicleRequestError,
  parseChronicleIdParam,
  parseChronicleNarratorId,
} from './chronicle.dto'

import {
  InvalidChronicleSessionRequestError,
  parseChronicleSessionIdParam,
} from './chronicle-session.dto'

import {
  InvalidChronicleSessionAttendanceRequestError,
  parseAddChronicleSessionAttendanceRequest,
  parseChronicleSessionAttendanceCharacterIdParam,
  toChronicleSessionAttendanceResponse,
} from './chronicle-session-attendance.dto'

import type {
  ChronicleSessionAttendanceRemovalResponseDto,
  ChronicleSessionAttendanceResponseDto,
} from './chronicle-session-attendance.dto'

interface AuthenticatedChronicleSessionAttendanceRequest {
  readonly user?: {
    readonly id?: unknown
  }
}

function authenticatedUserId(
  request:
    AuthenticatedChronicleSessionAttendanceRequest,
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

function throwAttendanceHttpError(
  error: unknown,
): never {
  if (
    error instanceof
      InvalidChronicleRequestError ||
    error instanceof
      InvalidChronicleSessionRequestError ||
    error instanceof
      InvalidChronicleSessionAttendanceRequestError
  ) {
    throw new BadRequestException({
      code:
        'INVALID_CHRONICLE_SESSION_ATTENDANCE_REQUEST',
      message: error.message,
    })
  }

  if (
    error instanceof
      ChronicleSessionPermissionError
  ) {
    throw new ForbiddenException({
      code:
        'CHRONICLE_SESSION_ATTENDANCE_PERMISSION_DENIED',
    })
  }

  if (
    error instanceof
      ChronicleSessionAttendanceSessionNotFoundError
  ) {
    throw new NotFoundException({
      code:
        'CHRONICLE_SESSION_ATTENDANCE_SESSION_NOT_FOUND',
    })
  }

  if (
    error instanceof
      ChronicleSessionAttendanceSessionNotEditableError
  ) {
    throw new UnprocessableEntityException({
      code:
        'CHRONICLE_SESSION_ATTENDANCE_SESSION_NOT_EDITABLE',
    })
  }

  if (
    error instanceof
      ChronicleSessionAttendanceCharacterNotEligibleError
  ) {
    throw new UnprocessableEntityException({
      code:
        'CHRONICLE_SESSION_ATTENDANCE_CHARACTER_NOT_ELIGIBLE',
    })
  }

  throw error
}

@Controller(
  'chronicles/:chronicleId/sessions/:sessionId/attendances',
)
export class ChronicleSessionAttendanceController {
  constructor(
    private readonly listAttendances:
      ListChronicleSessionAttendancesUseCase,
    private readonly addAttendance:
      AddChronicleSessionAttendanceUseCase,
    private readonly removeAttendance:
      RemoveChronicleSessionAttendanceUseCase,
  ) {}

  @Get()
  async list(
    @Req()
    request:
      AuthenticatedChronicleSessionAttendanceRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('sessionId')
    sessionIdInput: unknown,
    @Query()
    queryInput?:
      Record<string, unknown>,
  ) {
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
        if (
          error instanceof
            InvalidOffsetPaginationQueryError
        ) {
          throw new BadRequestException({
            code:
              'INVALID_PAGINATION_QUERY',
            field: error.field,
          })
        }

        throw error
      }

      const page =
        await this.listAttendances.execute(
          actorUserId,
          chronicleId,
          sessionId,
          query,
        )

      return {
        items: page.items.map(
          toChronicleSessionAttendanceResponse,
        ),
        nextOffset:
          page.nextOffset,
      }
    } catch (error: unknown) {
      throwAttendanceHttpError(error)
    }
  }

  @Post()
  async add(
    @Req()
    request:
      AuthenticatedChronicleSessionAttendanceRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('sessionId')
    sessionIdInput: unknown,
    @Body()
    body: unknown,
  ): Promise<
    ChronicleSessionAttendanceResponseDto
  > {
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

      const characterId =
        parseAddChronicleSessionAttendanceRequest(
          body,
        )

      return toChronicleSessionAttendanceResponse(
        await this.addAttendance.execute(
          actorUserId,
          chronicleId,
          sessionId,
          characterId,
        ),
      )
    } catch (error: unknown) {
      throwAttendanceHttpError(error)
    }
  }

  @Patch(':characterId/remove')
  async remove(
    @Req()
    request:
      AuthenticatedChronicleSessionAttendanceRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('sessionId')
    sessionIdInput: unknown,
    @Param('characterId')
    characterIdInput: unknown,
  ): Promise<
    ChronicleSessionAttendanceRemovalResponseDto
  > {
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

      const characterId =
        parseChronicleSessionAttendanceCharacterIdParam(
          characterIdInput,
        )

      await this.removeAttendance.execute(
        actorUserId,
        chronicleId,
        sessionId,
        characterId,
      )

      return {
        sessionId,
        characterId,
        attending: false,
      }
    } catch (error: unknown) {
      throwAttendanceHttpError(error)
    }
  }
}
