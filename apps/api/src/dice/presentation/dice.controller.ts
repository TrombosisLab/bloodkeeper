import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
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
  DicePoolInputError,
} from '../domain/dice-pool.rules'

import {
  DiceRollInputError,
} from '../domain/dice-roll.rules'

import {
  InvalidDiceRollRequestError,
  parseCharacterDiceRollRequest,
  parseManualDiceRollRequest,
  toDiceRollResponse,
} from './dice.dto'

import type {
  DiceRollResponseDto,
} from './dice.dto'

interface AuthenticatedDiceRequest {
  user?: {
    id?: unknown
  }
}

function authenticatedUserId(
  request: AuthenticatedDiceRequest,
): string {
  if (
    typeof request.user?.id !== 'string' ||
    request.user.id.length === 0
  ) {
    throw new UnauthorizedException({
      code: 'AUTHENTICATION_REQUIRED',
    })
  }
  return request.user.id
}

function throwDiceHttpError(error: unknown): never {
  if (error instanceof InvalidDiceRollRequestError) {
    throw new BadRequestException({
      code: 'INVALID_DICE_ROLL_REQUEST',
      message: error.message,
    })
  }

  if (
    error instanceof DicePoolInputError ||
    error instanceof DiceRollInputError ||
    error instanceof DicePoolSelectionError
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
  ) {}

  @Post('manual')
  manual(
    @Req() request: AuthenticatedDiceRequest,
    @Body() body: unknown,
  ): DiceRollResponseDto {
    authenticatedUserId(request)

    try {
      return toDiceRollResponse(
        this.executeManual.execute(
          parseManualDiceRollRequest(body),
        ),
      )
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
    const ownerId = authenticatedUserId(request)

    try {
      const result =
        await this.executeCharacter.execute(
          ownerId,
          parseCharacterDiceRollRequest(
            characterId,
            body,
          ),
        )

      if (result === null) {
        throw new NotFoundException({
          code: 'CHARACTER_NOT_FOUND',
        })
      }

      return toDiceRollResponse(result)
    } catch (error: unknown) {
      throwDiceHttpError(error)
    }
  }
}
