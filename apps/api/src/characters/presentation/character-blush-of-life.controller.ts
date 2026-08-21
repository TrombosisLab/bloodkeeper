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
  CharacterBlushOfLifeOperationConflictError,
  CharacterBlushOfLifeWriteConflictError,
} from '../application/character-blush-of-life.repository'

import {
  UseCharacterBlushOfLifeUseCase,
} from '../application/use-character-blush-of-life.use-case'

import {
  CharacterRouseCheckOperationConflictError,
  CharacterRouseCheckWriteConflictError,
} from '../application/character-rouse-check.repository'

import {
  CharacterRouseCheckArchivedError,
  CharacterRouseCheckNatureError,
  CharacterRouseCheckNotFoundError,
  CharacterRouseCheckPermissionError,
} from '../application/execute-character-rouse-check.use-case'

import {
  InvalidCharacterRouseCheckError,
} from '../domain/character-rouse-check.rules'

import {
  CharacterVampireStateUnavailableError,
} from '../domain/character-vampire-state.rules'

import {
  InvalidCharacterBlushOfLifeRequestError,
  parseUseCharacterBlushOfLifeRequest,
  toCharacterBlushOfLifeResponse,
} from './character-blush-of-life.dto'

import type {
  CharacterBlushOfLifeResponseDto,
} from './character-blush-of-life.dto'

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
      code:
        'AUTHENTICATION_REQUIRED',
    })
  }
}

function throwHttpError(
  error: unknown,
): never {
  if (
    error instanceof
      InvalidCharacterBlushOfLifeRequestError
  ) {
    throw new BadRequestException({
      code:
        'INVALID_CHARACTER_BLUSH_OF_LIFE_REQUEST',
      message:
        error.message,
    })
  }

  if (
    error instanceof
      CharacterRouseCheckPermissionError
  ) {
    throw new ForbiddenException({
      code:
        'CHARACTER_BLUSH_OF_LIFE_PERMISSION_DENIED',
    })
  }

  if (
    error instanceof
      CharacterRouseCheckNotFoundError
  ) {
    throw new NotFoundException({
      code:
        'CHARACTER_NOT_FOUND',
    })
  }

  if (
    error instanceof
      CharacterBlushOfLifeWriteConflictError ||
    error instanceof
      CharacterBlushOfLifeOperationConflictError ||
    error instanceof
      CharacterRouseCheckWriteConflictError ||
    error instanceof
      CharacterRouseCheckOperationConflictError
  ) {
    throw new ConflictException({
      code:
        'CHARACTER_BLUSH_OF_LIFE_CONFLICT',
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
        'CHARACTER_BLUSH_OF_LIFE_RULE_VIOLATION',
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
export class CharacterBlushOfLifeController {
  constructor(
    private readonly useBlushOfLife:
      UseCharacterBlushOfLifeUseCase,
  ) {}

  @Post(
    ':characterId/blood/blush-of-life',
  )
  async use(
    @Req()
    request: AuthenticatedRequest,
    @Param('characterId')
    characterIdInput: unknown,
    @Body()
    body: unknown,
  ): Promise<
    CharacterBlushOfLifeResponseDto
  > {
    const authenticatedActorId =
      actorId(request)

    try {
      return toCharacterBlushOfLifeResponse(
        await this.useBlushOfLife
          .execute(
            authenticatedActorId,
            parseUseCharacterBlushOfLifeRequest(
              characterIdInput,
              body,
            ),
          ),
      )
    } catch (error: unknown) {
      throwHttpError(error)
    }
  }
}
