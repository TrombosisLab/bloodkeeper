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
  ApplyCharacterBloodResonanceUseCase,
  CharacterBloodResonanceArchivedError,
  CharacterBloodResonanceNatureError,
  CharacterBloodResonanceNotFoundError,
  CharacterBloodResonancePermissionError,
} from '../application/apply-character-blood-resonance.use-case'

import {
  CharacterBloodResonanceOperationConflictError,
  CharacterBloodResonanceWriteConflictError,
} from '../application/character-draft.repository'

import {
  InvalidCharacterBloodResonanceError,
} from '../domain/character-blood-resonance.types'

import {
  CharacterVampireStateUnavailableError,
} from '../domain/character-vampire-state.rules'

import {
  parseApplyCharacterBloodResonanceRequest,
  InvalidCharacterBloodResonanceRequestError,
} from './character-blood-resonance.dto'

import {
  parseCharacterDraftOwnerId,
  toCharacterDraftResponse,
} from './character-draft.dto'

import type {
  CharacterDraftResponseDto,
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
      InvalidCharacterBloodResonanceRequestError
  ) {
    throw new BadRequestException({
      code:
        'INVALID_CHARACTER_BLOOD_RESONANCE_REQUEST',
      message: error.message,
    })
  }

  if (
    error instanceof
      CharacterBloodResonancePermissionError
  ) {
    throw new ForbiddenException({
      code:
        'CHARACTER_BLOOD_RESONANCE_PERMISSION_DENIED',
    })
  }

  if (
    error instanceof
      CharacterBloodResonanceNotFoundError
  ) {
    throw new NotFoundException({
      code: 'CHARACTER_NOT_FOUND',
    })
  }

  if (
    error instanceof
      CharacterBloodResonanceWriteConflictError ||
    error instanceof
      CharacterBloodResonanceOperationConflictError
  ) {
    throw new ConflictException({
      code:
        'CHARACTER_BLOOD_RESONANCE_CONFLICT',
    })
  }

  if (
    error instanceof
      InvalidCharacterBloodResonanceError ||
    error instanceof
      CharacterBloodResonanceArchivedError ||
    error instanceof
      CharacterBloodResonanceNatureError ||
    error instanceof
      CharacterVampireStateUnavailableError
  ) {
    throw new UnprocessableEntityException({
      code:
        'CHARACTER_BLOOD_RESONANCE_RULE_VIOLATION',
      violations:
        error instanceof
          InvalidCharacterBloodResonanceError
          ? error.violations
          : undefined,
    })
  }

  throw error
}

@Controller('characters')
export class CharacterBloodResonanceController {
  constructor(
    private readonly apply:
      ApplyCharacterBloodResonanceUseCase,
  ) {}

  @Post(':characterId/blood/resonance')
  async applyResonance(
    @Req() request: AuthenticatedRequest,
    @Param('characterId') characterIdInput: unknown,
    @Body() body: unknown,
  ): Promise<CharacterDraftResponseDto> {
    const authenticatedActorId =
      actorId(request)

    try {
      const command =
        parseApplyCharacterBloodResonanceRequest(
          characterIdInput,
          body,
        )

      const character =
        await this.apply.execute(
          authenticatedActorId,
          command,
        )

      return toCharacterDraftResponse(
        character,
      )
    } catch (error: unknown) {
      throwHttpError(error)
    }
  }
}
