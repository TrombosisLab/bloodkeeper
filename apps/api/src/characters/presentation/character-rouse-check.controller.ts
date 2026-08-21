import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  NotFoundException,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common'

import {
  CharacterRouseCheckArchivedError,
  CharacterRouseCheckNatureError,
  CharacterRouseCheckNotFoundError,
  CharacterRouseCheckPermissionError,
  ExecuteCharacterRouseCheckUseCase,
} from '../application/execute-character-rouse-check.use-case'

import {
  CharacterRouseCheckOperationConflictError,
  CharacterRouseCheckWriteConflictError,
} from '../application/character-rouse-check.repository'

import {
  InvalidCharacterRouseCheckError,
} from '../domain/character-rouse-check.rules'

import {
  CharacterVampireStateUnavailableError,
} from '../domain/character-vampire-state.rules'

import {
  InvalidCharacterRouseCheckRequestError,
  parseExecuteCharacterRouseCheckRequest,
  toCharacterRouseCheckResponse,
} from './character-rouse-check.dto'

import type {
  CharacterRouseCheckResponseDto,
} from './character-rouse-check.dto'

import {
  parseCharacterDraftOwnerId,
} from './character-draft.dto'

interface AuthenticatedRequest {
  user?: {
    id?: unknown
  }
}

function actorId(
  request: AuthenticatedRequest,
): string {
  try {
    return parseCharacterDraftOwnerId(
      request.user?.id,
    )
  } catch {
    throw new UnauthorizedException({
      code: 'AUTHENTICATION_REQUIRED',
    })
  }
}

function throwHttpError(
  error: unknown,
): never {
  if (
    error instanceof
      InvalidCharacterRouseCheckRequestError
  ) {
    throw new BadRequestException({
      code:
        'INVALID_CHARACTER_ROUSE_CHECK_REQUEST',
      message: error.message,
    })
  }

  if (
    error instanceof
      CharacterRouseCheckPermissionError
  ) {
    throw new ForbiddenException({
      code:
        'CHARACTER_ROUSE_CHECK_PERMISSION_DENIED',
    })
  }

  if (
    error instanceof
      CharacterRouseCheckNotFoundError
  ) {
    throw new NotFoundException({
      code: 'CHARACTER_NOT_FOUND',
    })
  }

  if (
    error instanceof
      CharacterRouseCheckWriteConflictError ||
    error instanceof
      CharacterRouseCheckOperationConflictError
  ) {
    throw new ConflictException({
      code:
        'CHARACTER_ROUSE_CHECK_CONFLICT',
    })
  }

  if (
    error instanceof
      InvalidCharacterRouseCheckError ||
    error instanceof
      CharacterRouseCheckArchivedError ||
    error instanceof
      CharacterRouseCheckNatureError ||
    error instanceof
      CharacterVampireStateUnavailableError
  ) {
    throw new UnprocessableEntityException({
      code:
        'CHARACTER_ROUSE_CHECK_RULE_VIOLATION',
      violations:
        error instanceof
          InvalidCharacterRouseCheckError
          ? error.violations
          : undefined,
    })
  }

  throw error
}

@Controller('characters')
export class CharacterRouseCheckController {
  constructor(
    private readonly execute:
      ExecuteCharacterRouseCheckUseCase,
  ) {}

  @Post(':characterId/blood/rouse-check')
  async executeRouseCheck(
    @Req() request: AuthenticatedRequest,
    @Param('characterId')
    characterIdInput: unknown,
    @Body() body: unknown,
  ): Promise<CharacterRouseCheckResponseDto> {
    const authenticatedActorId =
      actorId(request)

    try {
      const command =
        parseExecuteCharacterRouseCheckRequest(
          characterIdInput,
          body,
        )

      const operation =
        await this.execute.execute(
          authenticatedActorId,
          command,
        )

      return toCharacterRouseCheckResponse(
        operation,
      )
    } catch (error: unknown) {
      throwHttpError(error)
    }
  }
}
