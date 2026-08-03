import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Req,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common'

import {
  CharacterSecondaryWriteConflictError,
} from '../application/character-secondary.repository'

import {
  LoadCharacterSecondaryUseCase,
} from '../application/load-character-secondary.use-case'

import {
  UpdateCharacterSecondaryUseCase,
} from '../application/update-character-secondary.use-case'

import {
  InvalidCharacterSecondaryDataError,
} from '../domain/character-secondary.rules'

import {
  InvalidCharacterSecondaryRequestError,
  parseCharacterSecondaryIdParam,
  parseCharacterSecondaryOwnerId,
  parseUpdateCharacterSecondaryRequest,
  toCharacterSecondaryResponse,
} from './character-secondary.dto'

import type {
  CharacterSecondaryResponseDto,
} from './character-secondary.dto'

export interface AuthenticatedCharacterSecondaryRequest {
  user?: {
    id?: unknown
  }
}

function authenticatedOwnerId(
  request: AuthenticatedCharacterSecondaryRequest,
): string {
  try {
    return parseCharacterSecondaryOwnerId(
      request.user?.id,
    )
  } catch {
    throw new UnauthorizedException({
      code: 'AUTHENTICATION_REQUIRED',
    })
  }
}

function throwCharacterSecondaryHttpError(
  error: unknown,
): never {
  if (
    error instanceof
      InvalidCharacterSecondaryRequestError
  ) {
    throw new BadRequestException({
      code:
        'INVALID_CHARACTER_SECONDARY_REQUEST',
      message: error.message,
    })
  }

  if (
    error instanceof
      CharacterSecondaryWriteConflictError
  ) {
    throw new ConflictException({
      code:
        'CHARACTER_SECONDARY_WRITE_CONFLICT',
    })
  }

  if (
    error instanceof
      InvalidCharacterSecondaryDataError
  ) {
    throw new UnprocessableEntityException({
      code:
        'CHARACTER_SECONDARY_RULE_VIOLATION',
      violations: error.violations,
    })
  }

  throw error
}

@Controller('characters')
export class CharacterSecondaryController {
  constructor(
    private readonly loadSecondary:
      LoadCharacterSecondaryUseCase,
    private readonly updateSecondary:
      UpdateCharacterSecondaryUseCase,
  ) {}

  @Get(':characterId/secondary')
  async load(
    @Req()
    request: AuthenticatedCharacterSecondaryRequest,
    @Param('characterId') characterIdInput: unknown,
  ): Promise<CharacterSecondaryResponseDto> {
    const ownerId = authenticatedOwnerId(request)

    try {
      const characterId =
        parseCharacterSecondaryIdParam(
          characterIdInput,
        )
      const secondary =
        await this.loadSecondary.execute(
          ownerId,
          characterId,
        )

      if (secondary === null) {
        throw new NotFoundException({
          code: 'CHARACTER_SECONDARY_NOT_FOUND',
        })
      }

      return toCharacterSecondaryResponse(
        secondary,
      )
    } catch (error: unknown) {
      throwCharacterSecondaryHttpError(error)
    }
  }

  @Patch(':characterId/secondary')
  async update(
    @Req()
    request: AuthenticatedCharacterSecondaryRequest,
    @Param('characterId') characterIdInput: unknown,
    @Body() body: unknown,
  ): Promise<CharacterSecondaryResponseDto> {
    const ownerId = authenticatedOwnerId(request)

    try {
      const command =
        parseUpdateCharacterSecondaryRequest(
          characterIdInput,
          body,
        )
      const secondary =
        await this.updateSecondary.execute(
          ownerId,
          command,
        )

      return toCharacterSecondaryResponse(
        secondary,
      )
    } catch (error: unknown) {
      throwCharacterSecondaryHttpError(error)
    }
  }
}
