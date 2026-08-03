import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common'

import {
  ValidateCharacterUseCase,
} from '../application/validate-character.use-case'

import {
  InvalidCharacterDraftRequestError,
  parseCharacterDraftIdParam,
  parseCharacterDraftOwnerId,
} from './character-draft.dto'

import {
  InvalidCharacterValidationRequestError,
  parseCharacterValidationContext,
  toCharacterValidationResponse,
} from './character-validation.dto'

import type {
  CharacterValidationResponseDto,
} from './character-validation.dto'

interface AuthenticatedValidationRequest {
  user?: {
    id?: unknown
  }
}

function authenticatedOwnerId(
  request: AuthenticatedValidationRequest,
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

function throwValidationHttpError(
  error: unknown,
): never {
  if (
    error instanceof
      InvalidCharacterDraftRequestError ||
    error instanceof
      InvalidCharacterValidationRequestError
  ) {
    throw new BadRequestException({
      code:
        'INVALID_CHARACTER_VALIDATION_REQUEST',
      message: error.message,
    })
  }

  throw error
}

@Controller('characters')
export class CharacterValidationController {
  constructor(
    private readonly validateCharacter:
      ValidateCharacterUseCase,
  ) {}

  @Get(':characterId/validation')
  async validate(
    @Req() request: AuthenticatedValidationRequest,
    @Param('characterId') characterIdInput: unknown,
    @Query('context') contextInput: unknown,
  ): Promise<CharacterValidationResponseDto> {
    const ownerId = authenticatedOwnerId(request)

    try {
      const characterId =
        parseCharacterDraftIdParam(
          characterIdInput,
        )
      const context =
        parseCharacterValidationContext(
          contextInput,
        )
      const report =
        await this.validateCharacter.execute(
          ownerId,
          characterId,
          context,
        )

      if (report === null) {
        throw new NotFoundException({
          code: 'CHARACTER_NOT_FOUND',
        })
      }

      return toCharacterValidationResponse(report)
    } catch (error: unknown) {
      throwValidationHttpError(error)
    }
  }
}
