import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Req,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common'

import {
  CharacterProfilePhaseUnavailableError,
  LoadCharacterProfilePhaseUseCase,
} from '../application/load-character-profile-phase.use-case'

import {
  parseCharacterDraftIdParam,
  parseCharacterDraftOwnerId,
} from './character-draft.dto'

import {
  toCharacterProfilePhaseResponse,
} from './character-profile-phase.dto'

import type {
  CharacterProfilePhaseResponseDto,
} from './character-profile-phase.dto'

interface AuthenticatedProfilePhaseRequest {
  readonly user?: {
    readonly id?: unknown
  }
}

function authenticatedOwnerId(
  request: AuthenticatedProfilePhaseRequest,
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

@Controller('characters')
export class CharacterProfilePhaseController {
  constructor(
    private readonly loadProfilePhase:
      LoadCharacterProfilePhaseUseCase,
  ) {}

  @Get(':characterId/profile-phase')
  async load(
    @Req()
    request:
      AuthenticatedProfilePhaseRequest,
    @Param('characterId')
    characterIdInput: unknown,
  ): Promise<CharacterProfilePhaseResponseDto> {
    const ownerId =
      authenticatedOwnerId(request)

    const characterId =
      parseCharacterDraftIdParam(
        characterIdInput,
      )

    try {
      const snapshot =
        await this.loadProfilePhase.read(
          ownerId,
          characterId,
        )

      if (snapshot === null) {
        throw new NotFoundException({
          code: 'CHARACTER_NOT_FOUND',
        })
      }

      return toCharacterProfilePhaseResponse(
        snapshot,
      )
    } catch (error: unknown) {
      if (
        error instanceof
          CharacterProfilePhaseUnavailableError
      ) {
        throw new UnprocessableEntityException({
          code:
            'CHARACTER_PROFILE_PHASE_UNAVAILABLE',
        })
      }

      throw error
    }
  }
}
