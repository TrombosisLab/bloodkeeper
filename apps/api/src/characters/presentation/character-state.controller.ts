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
  CharacterStateWriteConflictError,
} from '../application/character-draft.repository'

import {
  UpdateCharacterStateUseCase,
} from '../application/update-character-state.use-case'

import {
  InvalidCharacterDamageStateError,
} from '../domain/character-damage.rules'

import {
  InvalidCharacterHumanityStateError,
} from '../domain/character-humanity-state.rules'

import {
  InvalidCharacterStateUpdateError,
} from '../domain/character-state.rules'

import {
  parseCharacterDraftOwnerId,
} from './character-draft.dto'

import {
  InvalidCharacterStateRequestError,
  parseUpdateCharacterStateRequest,
  toCharacterStateResponse,
} from './character-state.dto'

import type {
  CharacterStateResponseDto,
} from './character-state.dto'

interface AuthenticatedCharacterStateRequest {
  user?: {
    id?: unknown
  }
}

function authenticatedOwnerId(
  request: AuthenticatedCharacterStateRequest,
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

function throwCharacterStateHttpError(
  error: unknown,
): never {
  if (
    error instanceof
      InvalidCharacterStateRequestError
  ) {
    throw new BadRequestException({
      code: 'INVALID_CHARACTER_STATE_REQUEST',
      message: error.message,
    })
  }

  if (
    error instanceof
      CharacterStateWriteConflictError
  ) {
    throw new ConflictException({
      code: 'CHARACTER_STATE_WRITE_CONFLICT',
    })
  }

  if (
    error instanceof
      InvalidCharacterDamageStateError ||
    error instanceof
      InvalidCharacterHumanityStateError ||
    error instanceof
      InvalidCharacterStateUpdateError
  ) {
    throw new UnprocessableEntityException({
      code: 'CHARACTER_STATE_RULE_VIOLATION',
      violations: error.violations,
    })
  }

  throw error
}

@Controller('characters')
export class CharacterStateController {
  constructor(
    private readonly updateState:
      UpdateCharacterStateUseCase,
  ) {}

  @Patch(':characterId/state')
  async update(
    @Req() request: AuthenticatedCharacterStateRequest,
    @Param('characterId') characterIdInput: unknown,
    @Body() body: unknown,
  ): Promise<CharacterStateResponseDto> {
    const ownerId = authenticatedOwnerId(request)

    try {
      const command =
        parseUpdateCharacterStateRequest(
          characterIdInput,
          body,
        )

      const character =
        await this.updateState.execute(
          ownerId,
          command,
        )

      if (character === null) {
        throw new NotFoundException({
          code: 'CHARACTER_NOT_FOUND',
        })
      }

      return toCharacterStateResponse(character)
    } catch (error: unknown) {
      throwCharacterStateHttpError(error)
    }
  }
}
