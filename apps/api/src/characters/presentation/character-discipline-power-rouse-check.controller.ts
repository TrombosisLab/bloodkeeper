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
  CharacterDisciplinePowerRouseCheckUnavailableError,
  ExecuteCharacterDisciplinePowerRouseCheckUseCase,
} from '../application/execute-character-discipline-power-rouse-check.use-case'

import {
  CharacterDisciplinePowerRouseProfilesNotFoundError,
  CharacterDisciplinePowerRouseProfilesPermissionError,
} from '../application/load-character-discipline-power-rouse-profiles.use-case'

import {
  CharacterRouseCheckArchivedError,
  CharacterRouseCheckNatureError,
  CharacterRouseCheckNotFoundError,
  CharacterRouseCheckPermissionError,
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
  toCharacterRouseCheckResponse,
} from './character-rouse-check.dto'

import type {
  CharacterRouseCheckResponseDto,
} from './character-rouse-check.dto'

import {
  parseExecuteCharacterDisciplinePowerRouseCheckRequest,
} from './character-discipline-power-rouse-check.dto'

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

function throwHttpError(error: unknown): never {
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
      CharacterDisciplinePowerRouseProfilesPermissionError ||
    error instanceof CharacterRouseCheckPermissionError
  ) {
    throw new ForbiddenException({
      code:
        'CHARACTER_ROUSE_CHECK_PERMISSION_DENIED',
    })
  }

  if (
    error instanceof
      CharacterDisciplinePowerRouseProfilesNotFoundError ||
    error instanceof CharacterRouseCheckNotFoundError
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
      CharacterDisciplinePowerRouseCheckUnavailableError
  ) {
    throw new UnprocessableEntityException({
      code:
        'DISCIPLINE_POWER_ROUSE_UNAVAILABLE',
      violations: [error.status],
    })
  }

  if (
    error instanceof InvalidCharacterRouseCheckError ||
    error instanceof CharacterRouseCheckArchivedError ||
    error instanceof CharacterRouseCheckNatureError ||
    error instanceof CharacterVampireStateUnavailableError
  ) {
    throw new UnprocessableEntityException({
      code:
        'CHARACTER_ROUSE_CHECK_RULE_VIOLATION',
      violations:
        error instanceof InvalidCharacterRouseCheckError
          ? error.violations
          : undefined,
    })
  }

  throw error
}

@Controller('characters')
export class CharacterDisciplinePowerRouseCheckController {
  constructor(
    private readonly execute:
      ExecuteCharacterDisciplinePowerRouseCheckUseCase,
  ) {}

  @Post(':characterId/blood/discipline-rouse-check')
  async executeDisciplinePowerRouseCheck(
    @Req() request: AuthenticatedRequest,
    @Param('characterId') characterIdInput: unknown,
    @Body() body: unknown,
  ): Promise<CharacterRouseCheckResponseDto> {
    const authenticatedActorId =
      actorId(request)

    try {
      const command =
        parseExecuteCharacterDisciplinePowerRouseCheckRequest(
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

