import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common'

import {
  CreateChronicleUseCase,
} from '../application/create-chronicle.use-case'

import {
  ListChroniclesUseCase,
} from '../application/list-chronicles.use-case'

import {
  InvalidChronicleCreationError,
} from '../domain/chronicle-creation.rules'

import {
  InvalidChronicleRequestError,
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

  throw error
}

@Controller('chronicles')
export class ChronicleController {
  constructor(
    private readonly createChronicle:
      CreateChronicleUseCase,
    private readonly listChronicles:
      ListChroniclesUseCase,
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
}
