import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  NotFoundException,
  Param,
  Patch,
  Req,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common'

import {
  CharacterLifecycleWriteConflictError,
} from '../application/character-draft.repository'

import {
  TransitionCharacterLifecycleUseCase,
} from '../application/transition-character-lifecycle.use-case'

import {
  InvalidCharacterLifecycleTransitionError,
} from '../domain/character-lifecycle.rules'

import {
  InvalidCharacterDraftRequestError,
  parseCharacterDraftIdParam,
  parseCharacterDraftOwnerId,
} from './character-draft.dto'

import {
  InvalidCharacterLifecycleRequestError,
  parseCharacterLifecycleRequest,
  toCharacterLifecycleResponse,
} from './character-lifecycle.dto'

import type {
  CharacterLifecycleResponseDto,
} from './character-lifecycle.dto'

interface AuthenticatedLifecycleRequest {
  user?: {
    id?: unknown
  }
}

function authenticatedOwnerId(
  request: AuthenticatedLifecycleRequest,
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

function throwLifecycleHttpError(
  error: unknown,
): never {
  if (
    error instanceof
      InvalidCharacterDraftRequestError ||
    error instanceof
      InvalidCharacterLifecycleRequestError
  ) {
    throw new BadRequestException({
      code: 'INVALID_CHARACTER_LIFECYCLE_REQUEST',
      message: error.message,
    })
  }

  if (
    error instanceof
      CharacterLifecycleWriteConflictError
  ) {
    throw new ConflictException({
      code: 'CHARACTER_LIFECYCLE_WRITE_CONFLICT',
    })
  }

  if (
    error instanceof
      InvalidCharacterLifecycleTransitionError
  ) {
    throw new UnprocessableEntityException({
      code: 'CHARACTER_LIFECYCLE_TRANSITION_REJECTED',
      issues: error.issues,
    })
  }

  throw error
}

@Controller('characters')
export class CharacterLifecycleController {
  constructor(
    private readonly transitionLifecycle:
      TransitionCharacterLifecycleUseCase,
  ) {}

  @Patch(':characterId/lifecycle')
  async transition(
    @Req() request: AuthenticatedLifecycleRequest,
    @Param('characterId') characterIdInput: unknown,
    @Body() body: unknown,
  ): Promise<CharacterLifecycleResponseDto> {
    const ownerId = authenticatedOwnerId(request)

    try {
      const characterId =
        parseCharacterDraftIdParam(
          characterIdInput,
        )
      const command =
        parseCharacterLifecycleRequest(
          characterId,
          body,
        )
      const result =
        await this.transitionLifecycle.execute(
          ownerId,
          command,
        )

      if (result === null) {
        throw new NotFoundException({
          code: 'CHARACTER_NOT_FOUND',
        })
      }

      return toCharacterLifecycleResponse(result)
    } catch (error: unknown) {
      throwLifecycleHttpError(error)
    }
  }
}
