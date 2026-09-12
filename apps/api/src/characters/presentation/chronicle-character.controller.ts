import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common'

import {
  parseOffsetPaginationQuery,
} from '../../common/offset-pagination'

import {
  ChronicleCharacterListPermissionError,
  ListChronicleCharactersUseCase,
} from '../application/list-chronicle-characters.use-case'

import {
  ChronicleCharacterNotFoundError,
  ChronicleCharacterReadPermissionError,
  LoadChronicleCharacterUseCase,
} from '../application/load-chronicle-character.use-case'

import {
  LoadCharacterProfilePhaseUseCase,
} from '../application/load-character-profile-phase.use-case'

import {
  toCharacterDraftResponse,
} from './character-draft.dto'

import {
  toCharacterProfilePhaseResponse,
} from './character-profile-phase.dto'

interface AuthenticatedChronicleCharacterRequest {
  readonly user?: {
    readonly id?: unknown
  }
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function authenticatedUserId(
  request:
    AuthenticatedChronicleCharacterRequest,
): string {
  const value = request.user?.id

  if (
    typeof value !== 'string' ||
    !uuidPattern.test(value)
  ) {
    throw new UnauthorizedException({
      code: 'AUTHENTICATION_REQUIRED',
    })
  }

  return value
}

function chronicleId(
  value: unknown,
): string {
  if (
    typeof value !== 'string' ||
    !uuidPattern.test(value)
  ) {
    throw new BadRequestException({
      code:
        'INVALID_CHRONICLE_CHARACTER_REQUEST',
    })
  }

  return value
}

function characterId(
  value: unknown,
): string {
  if (
    typeof value !== 'string' ||
    !uuidPattern.test(value)
  ) {
    throw new BadRequestException({
      code: 'INVALID_CHRONICLE_CHARACTER_REQUEST',
    })
  }

  return value
}

function serializeCharacter(
  character: {
    readonly characterId: string
    readonly ownerId: string
    readonly chronicleId: string
    readonly status:
      | 'draft'
      | 'active'
      | 'archived'
    readonly name: string
    readonly concept: string | null
    readonly updatedAt: Date
  },
) {
  return {
    ...character,
    updatedAt:
      character.updatedAt.toISOString(),
  }
}

@Controller('chronicles')
export class ChronicleCharacterController {
  constructor(
    private readonly listCharacters:
      ListChronicleCharactersUseCase,
    private readonly loadCharacter:
      LoadChronicleCharacterUseCase,
    private readonly loadProfilePhase:
      LoadCharacterProfilePhaseUseCase,
  ) {}

  @Get(':chronicleId/characters')
  async list(
    @Req()
    request:
      AuthenticatedChronicleCharacterRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Query() queryInput?:
      Record<string, unknown>,
  ) {
    const requesterId =
      authenticatedUserId(request)

    const targetChronicleId =
      chronicleId(chronicleIdInput)

    try {
      if (queryInput === undefined) {
        const characters =
          await this.listCharacters.execute(
            requesterId,
            targetChronicleId,
          )

        return characters.map(
          serializeCharacter,
        )
      }

      let query

      try {
        query =
          parseOffsetPaginationQuery({
            limit: queryInput.limit,
            offset: queryInput.offset,
          })
      } catch (error: unknown) {
        throw new BadRequestException({
          code:
            'INVALID_PAGINATION_QUERY',
          message:
            error instanceof Error
              ? error.message
              : 'Invalid pagination query',
        })
      }

      const page =
        await this.listCharacters.execute(
          requesterId,
          targetChronicleId,
          query,
        )

      return {
        items: page.items.map(
          serializeCharacter,
        ),
        nextOffset:
          page.nextOffset,
      }
    } catch (error: unknown) {
      if (
        error instanceof
          ChronicleCharacterListPermissionError
      ) {
        throw new ForbiddenException({
          code:
            'CHRONICLE_CHARACTER_PERMISSION_DENIED',
        })
      }

      throw error
    }
  }


  @Get(':chronicleId/characters/:characterId')
  async load(
    @Req() request: AuthenticatedChronicleCharacterRequest,
    @Param('chronicleId') chronicleIdInput: unknown,
    @Param('characterId') characterIdInput: unknown,
  ) {
    const requesterId = authenticatedUserId(request)
    const targetChronicleId = chronicleId(chronicleIdInput)
    const targetCharacterId = characterId(characterIdInput)

    try {
      const character = await this.loadCharacter.execute(
        requesterId,
        targetChronicleId,
        targetCharacterId,
      )
      return toCharacterDraftResponse(character)
    } catch (error: unknown) {
      if (error instanceof ChronicleCharacterReadPermissionError) {
        throw new ForbiddenException({
          code: 'CHRONICLE_CHARACTER_READ_PERMISSION_DENIED',
        })
      }
      if (error instanceof ChronicleCharacterNotFoundError) {
        throw new NotFoundException({
          code: 'CHRONICLE_CHARACTER_NOT_FOUND',
        })
      }
      throw error
    }
  }

  @Get(':chronicleId/characters/:characterId/profile-phase')
  async profilePhase(
    @Req() request: AuthenticatedChronicleCharacterRequest,
    @Param('chronicleId') chronicleIdInput: unknown,
    @Param('characterId') characterIdInput: unknown,
  ) {
    const requesterId = authenticatedUserId(request)
    const targetChronicleId = chronicleId(chronicleIdInput)
    const targetCharacterId = characterId(characterIdInput)

    try {
      const character = await this.loadCharacter.execute(
        requesterId,
        targetChronicleId,
        targetCharacterId,
      )
      const snapshot = await this.loadProfilePhase.read(
        character.ownerId,
        character.characterId,
      )
      if (snapshot === null) {
        throw new NotFoundException({
          code: 'CHRONICLE_CHARACTER_NOT_FOUND',
        })
      }
      return toCharacterProfilePhaseResponse(snapshot)
    } catch (error: unknown) {
      if (error instanceof ChronicleCharacterReadPermissionError) {
        throw new ForbiddenException({
          code: 'CHRONICLE_CHARACTER_READ_PERMISSION_DENIED',
        })
      }
      if (error instanceof ChronicleCharacterNotFoundError) {
        throw new NotFoundException({
          code: 'CHRONICLE_CHARACTER_NOT_FOUND',
        })
      }
      throw error
    }
  }

}
