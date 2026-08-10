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
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common'
import {
  ArchiveChronicleEventUseCase,
} from '../application/archive-chronicle-event.use-case'
import {
  ChronicleEventPermissionError,
} from '../application/chronicle-event-permission'
import {
  ChronicleEventReorderMismatchError,
} from '../application/chronicle-event.repository'
import {
  CreateChronicleEventUseCase,
} from '../application/create-chronicle-event.use-case'
import {
  ListChronicleEventsUseCase,
} from '../application/list-chronicle-events.use-case'
import {
  LoadChronicleEventUseCase,
} from '../application/load-chronicle-event.use-case'
import {
  ReorderChronicleEventsUseCase,
} from '../application/reorder-chronicle-events.use-case'
import {
  ChronicleEventNotFoundError,
  UpdateChronicleEventUseCase,
} from '../application/update-chronicle-event.use-case'
import {
  InvalidChronicleEventRequestError,
  parseChronicleEventIdParam,
  parseCreateChronicleEventRequest,
  parseReorderChronicleEventsRequest,
  parseUpdateChronicleEventRequest,
  toChronicleEventResponse,
} from './chronicle-event.dto'
import {
  InvalidChronicleRequestError,
  parseChronicleIdParam,
  parseChronicleNarratorId,
} from './chronicle.dto'
import type {
  ChronicleEventResponseDto,
} from './chronicle-event.dto'

interface AuthenticatedChronicleEventRequest {
  readonly user?: {
    readonly id?: unknown
  }
}

function authenticatedUserId(
  request: AuthenticatedChronicleEventRequest,
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

function throwChronicleEventHttpError(
  error: unknown,
): never {
  if (
    error instanceof
      InvalidChronicleRequestError ||
    error instanceof
      InvalidChronicleEventRequestError
  ) {
    throw new BadRequestException({
      code:
        'INVALID_CHRONICLE_EVENT_REQUEST',
      message: error.message,
    })
  }

  if (
    error instanceof
      ChronicleEventPermissionError
  ) {
    throw new ForbiddenException({
      code:
        'CHRONICLE_EVENT_PERMISSION_DENIED',
    })
  }

  if (
    error instanceof
      ChronicleEventReorderMismatchError
  ) {
    throw new ConflictException({
      code:
        'CHRONICLE_EVENT_REORDER_MISMATCH',
    })
  }

  if (
    error instanceof
      ChronicleEventNotFoundError
  ) {
    throw new NotFoundException({
      code:
        'CHRONICLE_EVENT_NOT_FOUND',
    })
  }

  throw error
}

@Controller(
  'chronicles/:chronicleId/events',
)
export class ChronicleEventController {
  constructor(
    private readonly listEvents:
      ListChronicleEventsUseCase,
    private readonly loadEvent:
      LoadChronicleEventUseCase,
    private readonly createEvent:
      CreateChronicleEventUseCase,
    private readonly updateEvent:
      UpdateChronicleEventUseCase,
    private readonly reorderEvents:
      ReorderChronicleEventsUseCase,
    private readonly archiveEvent:
      ArchiveChronicleEventUseCase,
  ) {}

  @Get()
  async list(
    @Req() request:
      AuthenticatedChronicleEventRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
  ): Promise<
    readonly ChronicleEventResponseDto[]
  > {
    const actorUserId =
      authenticatedUserId(request)

    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )

      return (
        await this.listEvents.execute(
          actorUserId,
          chronicleId,
        )
      ).map(
        toChronicleEventResponse,
      )
    } catch (error: unknown) {
      throwChronicleEventHttpError(error)
    }
  }

  @Post()
  async create(
    @Req() request:
      AuthenticatedChronicleEventRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Body() body: unknown,
  ): Promise<ChronicleEventResponseDto> {
    const actorUserId =
      authenticatedUserId(request)

    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )

      const data =
        parseCreateChronicleEventRequest(
          chronicleId,
          body,
        )

      return toChronicleEventResponse(
        await this.createEvent.execute(
          actorUserId,
          data,
        ),
      )
    } catch (error: unknown) {
      throwChronicleEventHttpError(error)
    }
  }

  @Patch('reorder')
  async reorder(
    @Req() request:
      AuthenticatedChronicleEventRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Body() body: unknown,
  ): Promise<
    readonly ChronicleEventResponseDto[]
  > {
    const actorUserId =
      authenticatedUserId(request)

    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )

      const data =
        parseReorderChronicleEventsRequest(
          chronicleId,
          body,
        )

      return (
        await this.reorderEvents.execute(
          actorUserId,
          data,
        )
      ).map(
        toChronicleEventResponse,
      )
    } catch (error: unknown) {
      throwChronicleEventHttpError(error)
    }
  }

  @Get(':eventId')
  async detail(
    @Req() request:
      AuthenticatedChronicleEventRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('eventId')
    eventIdInput: unknown,
  ): Promise<ChronicleEventResponseDto> {
    const actorUserId =
      authenticatedUserId(request)

    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )
      const eventId =
        parseChronicleEventIdParam(
          eventIdInput,
        )

      const event =
        await this.loadEvent.execute(
          actorUserId,
          chronicleId,
          eventId,
        )

      if (event === null) {
        throw new ChronicleEventNotFoundError(
          eventId,
        )
      }

      return toChronicleEventResponse(
        event,
      )
    } catch (error: unknown) {
      throwChronicleEventHttpError(error)
    }
  }

  @Patch(':eventId')
  async update(
    @Req() request:
      AuthenticatedChronicleEventRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('eventId')
    eventIdInput: unknown,
    @Body() body: unknown,
  ): Promise<ChronicleEventResponseDto> {
    const actorUserId =
      authenticatedUserId(request)

    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )
      const eventId =
        parseChronicleEventIdParam(
          eventIdInput,
        )

      const data =
        parseUpdateChronicleEventRequest(
          chronicleId,
          eventId,
          body,
        )

      return toChronicleEventResponse(
        await this.updateEvent.execute(
          actorUserId,
          data,
        ),
      )
    } catch (error: unknown) {
      throwChronicleEventHttpError(error)
    }
  }

  @Patch(':eventId/archive')
  async archive(
    @Req() request:
      AuthenticatedChronicleEventRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('eventId')
    eventIdInput: unknown,
  ): Promise<ChronicleEventResponseDto> {
    const actorUserId =
      authenticatedUserId(request)

    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )
      const eventId =
        parseChronicleEventIdParam(
          eventIdInput,
        )

      return toChronicleEventResponse(
        await this.archiveEvent.execute(
          actorUserId,
          chronicleId,
          eventId,
        ),
      )
    } catch (error: unknown) {
      throwChronicleEventHttpError(error)
    }
  }
}
