import {
  InvalidOffsetPaginationQueryError,
  parseOffsetPaginationQuery,
} from '../../common/offset-pagination'

import type {
  OffsetPage,
} from '../../common/offset-pagination'

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
  UnprocessableEntityException,
  Query,
} from '@nestjs/common'

import {
  ChronicleLifecycleWriteConflictError,
} from '../application/chronicle.repository'

import {
  ChronicleParticipantDuplicateError,
  ChronicleParticipantWriteConflictError,
} from '../application/chronicle-participant.repository'

import {
  AddChronicleParticipantUseCase,
  ChronicleParticipantUserNotFoundError,
} from '../application/add-chronicle-participant.use-case'

import {
  ChronicleParticipantPermissionError,
  ListChronicleParticipantsUseCase,
} from '../application/list-chronicle-participants.use-case'

import {
  ListChronicleParticipantCandidatesUseCase,
} from '../application/list-chronicle-participant-candidates.use-case'

import {
  ChronicleLastNarratorRequiredError,
  ChronicleParticipantActiveCharacterRelationError,
  ChronicleParticipantNotFoundError,
  RetireChronicleParticipantUseCase,
} from '../application/retire-chronicle-participant.use-case'

import {
  CreateChronicleUseCase,
} from '../application/create-chronicle.use-case'

import {
  ListChroniclesUseCase,
} from '../application/list-chronicles.use-case'

import {
  LoadChronicleUseCase,
} from '../application/load-chronicle.use-case'

import {
  TransitionChronicleLifecycleUseCase,
} from '../application/transition-chronicle-lifecycle.use-case'

import {
  InvalidChronicleCreationError,
} from '../domain/chronicle-creation.rules'

import {
  InvalidChronicleLifecycleTransitionError,
} from '../domain/chronicle-lifecycle.rules'

import {
  InvalidChronicleRequestError,
  parseChronicleIdParam,
  parseChronicleLifecycleRequest,
  parseChronicleNarratorId,
  parseCreateChronicleRequest,
  toChronicleResponse,
} from './chronicle.dto'

import {
  InvalidChronicleParticipantRequestError,
  parseAddChronicleParticipantRequest,
  parseParticipantIdParam,
  toChronicleParticipantResponse,
} from './chronicle-participant.dto'

import type {
  ChronicleParticipantResponseDto,
} from './chronicle-participant.dto'

import type {
  ChronicleResponseDto,
} from './chronicle.dto'

export interface AuthenticatedChronicleRequest {
  readonly user?: {
    readonly id?: unknown
    readonly roles?: unknown
  }
}

function authenticatedChronicleUserId(
  request: AuthenticatedChronicleRequest,
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

function authenticatedNarratorId(
  request: AuthenticatedChronicleRequest,
): string {
  let narratorId: string

  try {
    narratorId = parseChronicleNarratorId(
      request.user?.id,
    )
  } catch {
    throw new UnauthorizedException({
      code: 'AUTHENTICATION_REQUIRED',
    })
  }

  const roles = request.user?.roles

  if (
    !Array.isArray(roles) ||
    !roles.includes('narrator')
  ) {
    throw new ForbiddenException({
      code: 'CHRONICLE_PERMISSION_DENIED',
    })
  }

  return narratorId
}

function throwChronicleHttpError(
  error: unknown,
): never {
  if (
    error instanceof
      InvalidChronicleRequestError
  ) {
    throw new BadRequestException({
      code: 'INVALID_CHRONICLE_REQUEST',
      message: error.message,
    })
  }

  if (
    error instanceof
      InvalidChronicleCreationError
  ) {
    throw new UnprocessableEntityException({
      code: 'CHRONICLE_RULE_VIOLATION',
      violations: error.issues,
    })
  }

  if (
    error instanceof
      InvalidChronicleLifecycleTransitionError
  ) {
    throw new UnprocessableEntityException({
      code:
        'CHRONICLE_LIFECYCLE_TRANSITION_REJECTED',
      issues: error.issues,
    })
  }

  if (
    error instanceof
      ChronicleLifecycleWriteConflictError
  ) {
    throw new ConflictException({
      code:
        'CHRONICLE_LIFECYCLE_WRITE_CONFLICT',
    })
  }

  if (
    error instanceof
      InvalidChronicleParticipantRequestError
  ) {
    throw new BadRequestException({
      code:
        'INVALID_CHRONICLE_PARTICIPANT_REQUEST',
      message: error.message,
    })
  }

  if (
    error instanceof
      ChronicleParticipantPermissionError
  ) {
    throw new ForbiddenException({
      code:
        'CHRONICLE_PARTICIPANT_PERMISSION_DENIED',
    })
  }

  if (
    error instanceof
      ChronicleParticipantUserNotFoundError
  ) {
    throw new NotFoundException({
      code:
        'CHRONICLE_PARTICIPANT_USER_NOT_FOUND',
    })
  }

  if (
    error instanceof
      ChronicleParticipantNotFoundError
  ) {
    throw new NotFoundException({
      code:
        'CHRONICLE_PARTICIPANT_NOT_FOUND',
    })
  }

  if (
    error instanceof
      ChronicleParticipantDuplicateError
  ) {
    throw new ConflictException({
      code:
        'CHRONICLE_PARTICIPANT_DUPLICATE',
    })
  }

  if (
    error instanceof
      ChronicleLastNarratorRequiredError
  ) {
    throw new ConflictException({
      code:
        'CHRONICLE_LAST_NARRATOR_REQUIRED',
    })
  }

  if (
    error instanceof
      ChronicleParticipantActiveCharacterRelationError
  ) {
    throw new ConflictException({
      code:
        'CHRONICLE_PARTICIPANT_ACTIVE_CHARACTER_RELATION',
    })
  }

  if (
    error instanceof
      ChronicleParticipantWriteConflictError
  ) {
    throw new ConflictException({
      code:
        'CHRONICLE_PARTICIPANT_WRITE_CONFLICT',
    })
  }

  throw error
}

@Controller('chronicles')
export class ChronicleController {
  constructor(
    private readonly createChronicle:
      CreateChronicleUseCase,
    private readonly listChronicles:
      ListChroniclesUseCase,
    private readonly loadChronicle:
      LoadChronicleUseCase,
    private readonly transitionLifecycle:
      TransitionChronicleLifecycleUseCase,
    private readonly listParticipants:
      ListChronicleParticipantsUseCase,
    private readonly listParticipantCandidates:
      ListChronicleParticipantCandidatesUseCase,
    private readonly addParticipant:
      AddChronicleParticipantUseCase,
    private readonly retireParticipant:
      RetireChronicleParticipantUseCase,
  ) {}

  @Post()
  async create(
    @Req() request:
      AuthenticatedChronicleRequest,
    @Body() body: unknown,
  ): Promise<ChronicleResponseDto> {
    const narratorId =
      authenticatedNarratorId(request)

    try {
      const command =
        parseCreateChronicleRequest(
          narratorId,
          body,
        )
      const chronicle =
        await this.createChronicle.execute(
          command,
        )

      return toChronicleResponse(
        chronicle,
      )
    } catch (error: unknown) {
      throwChronicleHttpError(error)
    }
  }

  @Get()
  async list(
    @Req() request:
      AuthenticatedChronicleRequest,
    @Query() queryInput?:
      Record<string, unknown>,
  ): Promise<
    | readonly ChronicleResponseDto[]
    | OffsetPage<ChronicleResponseDto>
  > {
    const narratorId =
      authenticatedChronicleUserId(request)

    if (queryInput === undefined) {
      const chronicles =
        await this.listChronicles.execute(
          narratorId,
        )

      return chronicles.map(
        toChronicleResponse,
      )
    }

    try {
      const query =
        parseOffsetPaginationQuery({
          limit: queryInput.limit,
          offset: queryInput.offset,
        })

      const page =
        await this.listChronicles.execute(
          narratorId,
          query,
        )

      return {
        items: page.items.map(
          toChronicleResponse,
        ),
        nextOffset:
          page.nextOffset,
      }
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
  }

  @Get(':chronicleId')
  async detail(
    @Req() request:
      AuthenticatedChronicleRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
  ): Promise<ChronicleResponseDto> {
    const narratorId =
      authenticatedChronicleUserId(request)

    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )
      const chronicle =
        await this.loadChronicle.execute(
          narratorId,
          chronicleId,
        )

      if (chronicle === null) {
        throw new NotFoundException({
          code: 'CHRONICLE_NOT_FOUND',
        })
      }

      return toChronicleResponse(
        chronicle,
      )
    } catch (error: unknown) {
      throwChronicleHttpError(error)
    }
  }

  @Patch(':chronicleId/lifecycle')
  async transition(
    @Req() request:
      AuthenticatedChronicleRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Body() body: unknown,
  ): Promise<ChronicleResponseDto> {
    const narratorId =
      authenticatedChronicleUserId(request)

    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )
      const nextStatus =
        parseChronicleLifecycleRequest(
          body,
        )
      const chronicle =
        await this.transitionLifecycle.execute(
          narratorId,
          chronicleId,
          nextStatus,
        )

      if (chronicle === null) {
        throw new NotFoundException({
          code: 'CHRONICLE_NOT_FOUND',
        })
      }

      return toChronicleResponse(
        chronicle,
      )
    } catch (error: unknown) {
      throwChronicleHttpError(error)
    }
  }
  @Get(':chronicleId/participants')
  async participants(
    @Req() request:
      AuthenticatedChronicleRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Query() queryInput?:
      Record<string, unknown>,
  ) {
    const actorUserId =
      authenticatedChronicleUserId(request)

    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )

      if (queryInput === undefined) {
        const participants =
          await this.listParticipants.execute(
            actorUserId,
            chronicleId,
          )

        return participants.map(
          toChronicleParticipantResponse,
        )
      }

      const query =
        parseOffsetPaginationQuery({
          limit: queryInput.limit,
          offset: queryInput.offset,
        })

      const page =
        await this.listParticipants.execute(
          actorUserId,
          chronicleId,
          query,
        )

      return {
        items: page.items.map(
          toChronicleParticipantResponse,
        ),
        nextOffset:
          page.nextOffset,
      }
    } catch (error: unknown) {
      throwChronicleHttpError(error)
    }
  }

  @Get(':chronicleId/participant-candidates')
  async participantCandidates(
    @Req() request:
      AuthenticatedChronicleRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Query() queryInput?:
      Record<string, unknown>,
  ) {
    const actorUserId =
      authenticatedChronicleUserId(request)

    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )

      const query =
        parseOffsetPaginationQuery({
          limit:
            queryInput?.limit,
          offset:
            queryInput?.offset,
        })

      const page =
        await this.listParticipantCandidates
          .execute(
            actorUserId,
            chronicleId,
            query,
          )

      return {
        items: page.items,
        nextOffset:
          page.nextOffset,
      }
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

      throwChronicleHttpError(error)
    }
  }

  @Post(':chronicleId/participants')
  async addChronicleParticipant(
    @Req() request:
      AuthenticatedChronicleRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Body() body: unknown,
  ): Promise<ChronicleParticipantResponseDto> {
    const actorUserId =
      authenticatedChronicleUserId(request)

    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )
      const command =
        parseAddChronicleParticipantRequest(
          chronicleId,
          body,
        )
      const participant =
        await this.addParticipant.execute(
          actorUserId,
          command,
        )

      return toChronicleParticipantResponse(
        participant,
      )
    } catch (error: unknown) {
      throwChronicleHttpError(error)
    }
  }

  @Patch(
    ':chronicleId/participants/:participantId/retire',
  )
  async retireChronicleParticipant(
    @Req() request:
      AuthenticatedChronicleRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('participantId')
    participantIdInput: unknown,
  ): Promise<ChronicleParticipantResponseDto> {
    const actorUserId =
      authenticatedChronicleUserId(request)

    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )
      const participantId =
        parseParticipantIdParam(
          participantIdInput,
        )
      const participant =
        await this.retireParticipant.execute(
          actorUserId,
          chronicleId,
          participantId,
        )

      return toChronicleParticipantResponse(
        participant,
      )
    } catch (error: unknown) {
      throwChronicleHttpError(error)
    }
  }

}
