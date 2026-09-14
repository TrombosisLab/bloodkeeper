import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Req,
  UnauthorizedException,
} from '@nestjs/common'

import {
  CharacterDisciplinePowerRouseProfilesNotFoundError,
  CharacterDisciplinePowerRouseProfilesPermissionError,
  LoadCharacterDisciplinePowerRouseProfilesUseCase,
} from '../application/load-character-discipline-power-rouse-profiles.use-case'

import {
  InvalidCharacterDraftRequestError,
  parseCharacterDraftIdParam,
  parseCharacterDraftOwnerId,
} from './character-draft.dto'

interface AuthenticatedRequest {
  readonly user?: {
    readonly id?: unknown
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

@Controller('characters')
export class CharacterDisciplinePowerRouseProfilesController {
  constructor(
    private readonly load:
      LoadCharacterDisciplinePowerRouseProfilesUseCase,
  ) {}

  @Get(':characterId/blood/discipline-rouse-profiles')
  async list(
    @Req() request: AuthenticatedRequest,
    @Param('characterId') characterIdInput: unknown,
  ) {
    const requesterId = actorId(request)

    let characterId: string

    try {
      characterId = parseCharacterDraftIdParam(
        characterIdInput,
      )
    } catch (error: unknown) {
      if (
        error instanceof
        InvalidCharacterDraftRequestError
      ) {
        throw new BadRequestException({
          code:
            'INVALID_CHARACTER_ROUSE_PROFILE_REQUEST',
          message: error.message,
        })
      }

      throw error
    }

    try {
      const snapshot = await this.load.execute(
        requesterId,
        characterId,
      )

      return {
        characterId: snapshot.characterId,
        characterRevision:
          snapshot.characterRevision,
        bloodPotency: snapshot.bloodPotency,
        profiles: snapshot.profiles,
      }
    } catch (error: unknown) {
      if (
        error instanceof
        CharacterDisciplinePowerRouseProfilesPermissionError
      ) {
        throw new ForbiddenException({
          code:
            'CHARACTER_ROUSE_PROFILE_PERMISSION_DENIED',
        })
      }

      if (
        error instanceof
        CharacterDisciplinePowerRouseProfilesNotFoundError
      ) {
        throw new NotFoundException({
          code: 'CHARACTER_NOT_FOUND',
        })
      }

      throw error
    }
  }
}
