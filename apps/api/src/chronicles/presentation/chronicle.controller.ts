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
} from '@nestjs/common'

import {
  ChronicleLifecycleWriteConflictError,
} from '../application/chronicle.repository'

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

import type {
  ChronicleResponseDto,
} from './chronicle.dto'

export interface AuthenticatedChronicleRequest {
  readonly user?: {
    readonly id?: unknown
    readonly roles?: unknown
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
  ): Promise<
    readonly ChronicleResponseDto[]
  > {
    const narratorId =
      authenticatedNarratorId(request)

    const chronicles =
      await this.listChronicles.execute(
        narratorId,
      )

    return chronicles.map(
      toChronicleResponse,
    )
  }

  @Get(':chronicleId')
  async detail(
    @Req() request:
      AuthenticatedChronicleRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
  ): Promise<ChronicleResponseDto> {
    const narratorId =
      authenticatedNarratorId(request)

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
      authenticatedNarratorId(request)

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
}
