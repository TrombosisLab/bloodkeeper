import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common'

import {
  DicePoolSelectionError,
  ExecuteCharacterDiceRollUseCase,
} from '../application/execute-character-dice-roll.use-case'

import {
  ExecuteManualDiceRollUseCase,
} from '../application/execute-manual-dice-roll.use-case'

import {
  DiceRollContextMismatchError,
  DiceRollContextNotFoundError,
  DiceRollContextPermissionError,
} from '../application/dice-roll-context'

import {
  RecordCharacterDiceRollUseCase,
} from '../application/record-character-dice-roll.use-case'

import {
  RecordManualDiceRollUseCase,
} from '../application/record-manual-dice-roll.use-case'

import {
  ListDiceRollHistoryUseCase,
  LoadDiceRollHistoryUseCase,
} from '../application/dice-history.use-cases'

import { DicePoolInputError } from '../domain/dice-pool.rules'
import { DiceRollInputError } from '../domain/dice-roll.rules'

import {
  InvalidDiceRollRequestError,
  parseCharacterDiceRollRequest,
  parseManualDiceRollRequest,
  toDicePoolResponse,
  toDiceRollResponse,
} from './dice.dto'

import type {
  DicePoolResponseDto,
  DiceRollResponseDto,
} from './dice.dto'

import {
  InvalidDiceHistoryRequestError,
  parseDiceHistoryQuery,
  parseDiceRollHistoryId,
  toDiceHistoryPageResponse,
} from './dice-history.dto'

import type {
  DiceRollHistoryPageResponseDto,
} from './dice-history.dto'

interface AuthenticatedDiceRequest {
  user?: { id?: unknown }
}

function authenticatedUserId(
  request: AuthenticatedDiceRequest,
): string {
  if (typeof request.user?.id !== 'string' || request.user.id.length === 0) {
    throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' })
  }
  return request.user.id
}

function throwDiceHttpError(error: unknown): never {
  if (
    error instanceof InvalidDiceRollRequestError ||
    error instanceof InvalidDiceHistoryRequestError
  ) {
    throw new BadRequestException({
      code: 'INVALID_DICE_ROLL_REQUEST',
      message: error.message,
    })
  }
  if (error instanceof DiceRollContextPermissionError) {
    throw new ForbiddenException({
      code: 'DICE_CONTEXT_PERMISSION_DENIED',
    })
  }
  if (error instanceof DiceRollContextNotFoundError) {
    throw new NotFoundException({
      code: 'DICE_CONTEXT_NOT_FOUND',
      message: error.message,
    })
  }
  if (
    error instanceof DicePoolInputError ||
    error instanceof DiceRollInputError ||
    error instanceof DicePoolSelectionError ||
    error instanceof DiceRollContextMismatchError
  ) {
    throw new UnprocessableEntityException({
      code: 'DICE_ROLL_RULE_VIOLATION',
      message: error.message,
    })
  }
  throw error
}

@Controller('dice')
export class DiceController {
  constructor(
    private readonly executeManual:
      ExecuteManualDiceRollUseCase,
    private readonly executeCharacter:
      ExecuteCharacterDiceRollUseCase,
    private readonly recordManual:
      RecordManualDiceRollUseCase,
    private readonly recordCharacter:
      RecordCharacterDiceRollUseCase,
    private readonly listHistory:
      ListDiceRollHistoryUseCase,
    private readonly loadHistory:
      LoadDiceRollHistoryUseCase,
  ) {}

  @Post('manual/preview')
  manualPreview(
    @Req() request: AuthenticatedDiceRequest,
    @Body() body: unknown,
  ): DicePoolResponseDto {
    authenticatedUserId(request)
    try {
      return toDicePoolResponse(
        this.executeManual.preview(
          parseManualDiceRollRequest(body),
        ),
      )
    } catch (error: unknown) {
      throwDiceHttpError(error)
    }
  }

  @Post('manual')
  async manual(
    @Req() request: AuthenticatedDiceRequest,
    @Body() body: unknown,
  ): Promise<DiceRollResponseDto> {
    const actorId = authenticatedUserId(request)
    try {
      return toDiceRollResponse(
        await this.recordManual.execute(
          actorId,
          parseManualDiceRollRequest(body),
        ),
      )
    } catch (error: unknown) {
      throwDiceHttpError(error)
    }
  }

  @Post('characters/:characterId/preview')
  async characterPreview(
    @Req() request: AuthenticatedDiceRequest,
    @Param('characterId') characterId: unknown,
    @Body() body: unknown,
  ): Promise<DicePoolResponseDto> {
    const ownerId = authenticatedUserId(request)
    try {
      const pool = await this.executeCharacter.preview(
        ownerId,
        parseCharacterDiceRollRequest(characterId, body),
      )
      if (pool === null) {
        throw new NotFoundException({ code: 'CHARACTER_NOT_FOUND' })
      }
      return toDicePoolResponse(pool)
    } catch (error: unknown) {
      throwDiceHttpError(error)
    }
  }

  @Post('characters/:characterId')
  async character(
    @Req() request: AuthenticatedDiceRequest,
    @Param('characterId') characterId: unknown,
    @Body() body: unknown,
  ): Promise<DiceRollResponseDto> {
    const actorId = authenticatedUserId(request)
    try {
      const record = await this.recordCharacter.execute(
        actorId,
        parseCharacterDiceRollRequest(characterId, body),
      )
      if (record === null) {
        throw new NotFoundException({ code: 'CHARACTER_NOT_FOUND' })
      }
      return toDiceRollResponse(record)
    } catch (error: unknown) {
      throwDiceHttpError(error)
    }
  }

  @Get('history')
  async history(
    @Req() request: AuthenticatedDiceRequest,
    @Query() query: unknown,
  ): Promise<DiceRollHistoryPageResponseDto> {
    const viewerId = authenticatedUserId(request)
    try {
      return toDiceHistoryPageResponse(
        await this.listHistory.execute(
          viewerId,
          parseDiceHistoryQuery(query),
        ),
      )
    } catch (error: unknown) {
      throwDiceHttpError(error)
    }
  }

  @Get('history/:rollId')
  async historyDetail(
    @Req() request: AuthenticatedDiceRequest,
    @Param('rollId') rollIdInput: unknown,
  ): Promise<DiceRollResponseDto> {
    const viewerId = authenticatedUserId(request)
    try {
      const rollId = parseDiceRollHistoryId(rollIdInput)
      const record = await this.loadHistory.execute(
        viewerId,
        rollId,
      )
      if (record === null) {
        throw new NotFoundException({
          code: 'DICE_ROLL_NOT_FOUND',
        })
      }
      return toDiceRollResponse(record)
    } catch (error: unknown) {
      throwDiceHttpError(error)
    }
  }
}
