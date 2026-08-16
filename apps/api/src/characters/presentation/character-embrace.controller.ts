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
  CharacterEmbraceWriteConflictError,
} from '../application/character-draft.repository'

import {
  CharacterAlreadyEmbracedError,
  CharacterEmbraceArchivedError,
  CharacterEmbraceCreationModeError,
  CharacterEmbraceHumanProfileIncompleteError,
  CharacterEmbraceNotFoundError,
  CharacterEmbracePermissionError,
  EmbraceCharacterUseCase,
} from '../application/embrace-character.use-case'

import {
  parseCharacterDraftOwnerId,
} from './character-draft.dto'

import {
  InvalidCharacterEmbraceRequestError,
  parseCharacterEmbraceRequest,
  toCharacterEmbraceResponse,
} from './character-embrace.dto'

import type {
  CharacterEmbraceResponseDto,
} from './character-embrace.dto'

interface AuthenticatedCharacterEmbraceRequest {
  readonly user?: {
    readonly id?: unknown
  }
}

function authenticatedActorId(
  request:
    AuthenticatedCharacterEmbraceRequest,
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

function throwCharacterEmbraceHttpError(
  error: unknown,
): never {
  if (
    error instanceof
      InvalidCharacterEmbraceRequestError
  ) {
    throw new BadRequestException({
      code:
        'INVALID_CHARACTER_EMBRACE_REQUEST',
      message: error.message,
    })
  }

  if (
    error instanceof
      CharacterEmbraceNotFoundError
  ) {
    throw new NotFoundException({
      code: 'CHARACTER_NOT_FOUND',
    })
  }

  if (
    error instanceof
      CharacterEmbracePermissionError
  ) {
    throw new ForbiddenException({
      code:
        'CHARACTER_EMBRACE_PERMISSION_DENIED',
    })
  }

  if (
    error instanceof
      CharacterEmbraceWriteConflictError
  ) {
    throw new ConflictException({
      code: 'CHARACTER_REVISION_CONFLICT',
    })
  }

  if (
    error instanceof
      CharacterAlreadyEmbracedError
  ) {
    throw new ConflictException({
      code: 'CHARACTER_ALREADY_EMBRACED',
    })
  }

  if (
    error instanceof
      CharacterEmbraceArchivedError
  ) {
    throw new UnprocessableEntityException({
      code: 'CHARACTER_ARCHIVED',
    })
  }

  if (
    error instanceof
      CharacterEmbraceCreationModeError
  ) {
    throw new UnprocessableEntityException({
      code:
        'CHARACTER_CREATION_MODE_INCOMPATIBLE',
    })
  }

  if (
    error instanceof
      CharacterEmbraceHumanProfileIncompleteError
  ) {
    throw new UnprocessableEntityException({
      code:
        'CHARACTER_HUMAN_PROFILE_INCOMPLETE',
      validation: error.validation,
    })
  }

  throw error
}

@Controller('characters')
export class CharacterEmbraceController {
  constructor(
    private readonly embrace:
      EmbraceCharacterUseCase,
  ) {}

  @Post(':characterId/embrace')
  async execute(
    @Req()
    request:
      AuthenticatedCharacterEmbraceRequest,
    @Param('characterId')
    characterIdInput: unknown,
    @Body() body: unknown,
  ): Promise<CharacterEmbraceResponseDto> {
    const actorUserId =
      authenticatedActorId(request)

    try {
      const result =
        await this.embrace.execute(
          actorUserId,
          parseCharacterEmbraceRequest(
            characterIdInput,
            body,
          ),
        )

      return toCharacterEmbraceResponse(
        result,
      )
    } catch (error: unknown) {
      throwCharacterEmbraceHttpError(
        error,
      )
    }
  }
}
