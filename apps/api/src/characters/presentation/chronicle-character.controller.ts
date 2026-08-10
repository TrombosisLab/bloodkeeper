import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Req,
  UnauthorizedException,
} from '@nestjs/common'

import {
  ChronicleCharacterListPermissionError,
  ListChronicleCharactersUseCase,
} from '../application/list-chronicle-characters.use-case'

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

@Controller('chronicles')
export class ChronicleCharacterController {
  constructor(
    private readonly listCharacters:
      ListChronicleCharactersUseCase,
  ) {}

  @Get(':chronicleId/characters')
  async list(
    @Req()
    request:
      AuthenticatedChronicleCharacterRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
  ) {
    const requesterId =
      authenticatedUserId(request)

    const targetChronicleId =
      chronicleId(chronicleIdInput)

    try {
      const characters =
        await this.listCharacters.execute(
          requesterId,
          targetChronicleId,
        )

      return characters.map(
        (character) => ({
          ...character,
          updatedAt:
            character.updatedAt.toISOString(),
        }),
      )
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
}
