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
  CreateChronicleNpcUseCase,
} from '../application/create-chronicle-npc.use-case'

import {
  ListChronicleNpcsUseCase,
} from '../application/list-chronicle-npcs.use-case'

import {
  LoadChronicleNpcUseCase,
} from '../application/load-chronicle-npc.use-case'

import {
  UpdateChronicleNpcUseCase,
  ChronicleNpcNotFoundError,
} from '../application/update-chronicle-npc.use-case'

import {
  ArchiveChronicleNpcUseCase,
} from '../application/archive-chronicle-npc.use-case'

import {
  ChronicleNpcPermissionError,
} from '../application/chronicle-npc-permission'

import {
  InvalidChronicleNpcRequestError,
  parseChronicleNpcIdParam,
  parseCreateChronicleNpcRequest,
  parseUpdateChronicleNpcRequest,
  toChronicleNpcResponse,
} from './chronicle-npc.dto'

import {
  InvalidChronicleRequestError,
  parseChronicleIdParam,
  parseChronicleNarratorId,
} from './chronicle.dto'

import type {
  ChronicleNpcResponseDto,
} from './chronicle-npc.dto'

interface AuthenticatedChronicleNpcRequest {
  readonly user?: {
    readonly id?: unknown
  }
}

function authenticatedUserId(
  request: AuthenticatedChronicleNpcRequest,
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

function throwChronicleNpcHttpError(
  error: unknown,
): never {
  if (
    error instanceof
      InvalidChronicleRequestError
  ) {
    throw new BadRequestException({
      code: 'INVALID_CHRONICLE_NPC_REQUEST',
      message: error.message,
    })
  }

  if (
    error instanceof
      InvalidChronicleNpcRequestError
  ) {
    throw new BadRequestException({
      code: 'INVALID_CHRONICLE_NPC_REQUEST',
      message: error.message,
    })
  }

  if (
    error instanceof
      ChronicleNpcPermissionError
  ) {
    throw new ForbiddenException({
      code:
        'CHRONICLE_NPC_PERMISSION_DENIED',
    })
  }

  if (
    error instanceof
      ChronicleNpcNotFoundError
  ) {
    throw new NotFoundException({
      code: 'CHRONICLE_NPC_NOT_FOUND',
    })
  }

  throw error
}

@Controller('chronicles/:chronicleId/npcs')
export class ChronicleNpcController {
  constructor(
    private readonly listNpcs:
      ListChronicleNpcsUseCase,
    private readonly loadNpc:
      LoadChronicleNpcUseCase,
    private readonly createNpc:
      CreateChronicleNpcUseCase,
    private readonly updateNpc:
      UpdateChronicleNpcUseCase,
    private readonly archiveNpc:
      ArchiveChronicleNpcUseCase,
  ) {}

  @Get()
  async list(
    @Req() request:
      AuthenticatedChronicleNpcRequest,
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
        await this.listNpcs.execute(
          actorUserId,
          chronicleId,
          query,
        )

      return {
        items: page.items.map(
          toChronicleNpcResponse,
        ),
        nextOffset:
          page.nextOffset,
      }
    } catch (error: unknown) {
      throwChronicleNpcHttpError(error)
    }
  }

  @Post()
  async create(
    @Req() request:
      AuthenticatedChronicleNpcRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Body() body: unknown,
  ): Promise<ChronicleNpcResponseDto> {
    const actorUserId =
      authenticatedUserId(request)

    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )

      const data =
        parseCreateChronicleNpcRequest(
          chronicleId,
          body,
        )

      return toChronicleNpcResponse(
        await this.createNpc.execute(
          actorUserId,
          data,
        ),
      )
    } catch (error: unknown) {
      throwChronicleNpcHttpError(error)
    }
  }

  @Get(':npcId')
  async detail(
    @Req() request:
      AuthenticatedChronicleNpcRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('npcId')
    npcIdInput: unknown,
  ): Promise<ChronicleNpcResponseDto> {
    const actorUserId =
      authenticatedUserId(request)

    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )
      const npcId =
        parseChronicleNpcIdParam(
          npcIdInput,
        )

      const npc =
        await this.loadNpc.execute(
          actorUserId,
          chronicleId,
          npcId,
        )

      if (npc === null) {
        throw new ChronicleNpcNotFoundError(
          npcId,
        )
      }

      return toChronicleNpcResponse(npc)
    } catch (error: unknown) {
      throwChronicleNpcHttpError(error)
    }
  }

  @Patch(':npcId')
  async update(
    @Req() request:
      AuthenticatedChronicleNpcRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('npcId')
    npcIdInput: unknown,
    @Body() body: unknown,
  ): Promise<ChronicleNpcResponseDto> {
    const actorUserId =
      authenticatedUserId(request)

    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )
      const npcId =
        parseChronicleNpcIdParam(
          npcIdInput,
        )

      const data =
        parseUpdateChronicleNpcRequest(
          chronicleId,
          npcId,
          body,
        )

      return toChronicleNpcResponse(
        await this.updateNpc.execute(
          actorUserId,
          data,
        ),
      )
    } catch (error: unknown) {
      throwChronicleNpcHttpError(error)
    }
  }

  @Patch(':npcId/archive')
  async archive(
    @Req() request:
      AuthenticatedChronicleNpcRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('npcId')
    npcIdInput: unknown,
  ): Promise<ChronicleNpcResponseDto> {
    const actorUserId =
      authenticatedUserId(request)

    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )
      const npcId =
        parseChronicleNpcIdParam(
          npcIdInput,
        )

      return toChronicleNpcResponse(
        await this.archiveNpc.execute(
          actorUserId,
          chronicleId,
          npcId,
        ),
      )
    } catch (error: unknown) {
      throwChronicleNpcHttpError(error)
    }
  }
}
