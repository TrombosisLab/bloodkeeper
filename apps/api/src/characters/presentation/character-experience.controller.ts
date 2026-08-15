import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common'
import {
  InvalidOffsetPaginationQueryError,
  parseOffsetPaginationQuery,
} from '../../common/offset-pagination'
import {
  CorrectCharacterExperienceUseCase,
  CharacterExperienceCharacterNotFoundError,
  CharacterExperienceChronicleRequiredError,
  CharacterExperienceSessionRequiredError,
  CharacterExperienceSessionRuleError,
  GrantCharacterExperienceUseCase,
  LoadCharacterExperienceUseCase,
} from '../application/character-experience.use-cases'
import {
  CharacterExperienceDuplicateError,
  CharacterExperienceMovementNotFoundError,
  CharacterExperienceSessionInvalidError,
  CharacterExperienceWriteConflictError,
} from '../application/character-experience.repository'
import {
  CharacterExperiencePermissionError,
} from '../application/character-experience-permission'
import {
  CharacterExperienceBalanceError,
} from '../domain/character-experience.rules'
import {
  InvalidCharacterExperienceRequestError,
  parseCharacterExperienceIdParam,
  parseCharacterExperienceUserId,
  parseCorrectCharacterExperienceRequest,
  parseGrantCharacterExperienceRequest,
  toCharacterExperiencePageResponse,
  toCharacterExperienceResponse,
} from './character-experience.dto'
import type {
  CharacterExperiencePageResponseDto,
  CharacterExperienceResponseDto,
} from './character-experience.dto'

interface AuthenticatedCharacterExperienceRequest {
  readonly user?: {
    readonly id?: unknown
  }
}

function authenticatedUserId(
  request: AuthenticatedCharacterExperienceRequest,
): string {
  try {
    return parseCharacterExperienceUserId(
      request.user?.id,
    )
  } catch {
    throw new UnauthorizedException({
      code: 'AUTHENTICATION_REQUIRED',
    })
  }
}

function throwCharacterExperienceHttpError(
  error: unknown,
): never {
  if (
    error instanceof
      InvalidCharacterExperienceRequestError
  ) {
    throw new BadRequestException({
      code:
        'INVALID_CHARACTER_EXPERIENCE_REQUEST',
      message: error.message,
    })
  }

  if (
    error instanceof
      CharacterExperiencePermissionError
  ) {
    throw new ForbiddenException({
      code:
        'CHARACTER_EXPERIENCE_PERMISSION_DENIED',
    })
  }

  if (
    error instanceof
      CharacterExperienceCharacterNotFoundError ||
    error instanceof
      CharacterExperienceMovementNotFoundError
  ) {
    throw new NotFoundException({
      code:
        'CHARACTER_EXPERIENCE_NOT_FOUND',
    })
  }

  if (
    error instanceof
      CharacterExperienceDuplicateError
  ) {
    throw new ConflictException({
      code:
        'CHARACTER_EXPERIENCE_DUPLICATE',
    })
  }

  if (
    error instanceof
      CharacterExperienceWriteConflictError
  ) {
    throw new ConflictException({
      code:
        'CHARACTER_EXPERIENCE_WRITE_CONFLICT',
    })
  }

  if (
    error instanceof
      CharacterExperienceChronicleRequiredError ||
    error instanceof
      CharacterExperienceSessionRequiredError ||
    error instanceof
      CharacterExperienceSessionRuleError ||
    error instanceof
      CharacterExperienceSessionInvalidError ||
    error instanceof
      CharacterExperienceBalanceError
  ) {
    throw new UnprocessableEntityException({
      code:
        'CHARACTER_EXPERIENCE_RULE_VIOLATION',
      message: error.message,
    })
  }

  throw error
}

@Controller(
  'characters/:characterId/experience',
)
export class CharacterExperienceController {
  constructor(
    private readonly loadExperience:
      LoadCharacterExperienceUseCase,
    private readonly grantExperience:
      GrantCharacterExperienceUseCase,
    private readonly correctExperience:
      CorrectCharacterExperienceUseCase,
  ) {}

  @Get()
  async load(
    @Req() request:
      AuthenticatedCharacterExperienceRequest,
    @Param('characterId')
    characterIdInput: unknown,
    @Query() queryInput?:
      Record<string, unknown>,
  ): Promise<CharacterExperiencePageResponseDto> {
    const actorUserId =
      authenticatedUserId(request)

    try {
      const characterId =
        parseCharacterExperienceIdParam(
          characterIdInput,
        )

      const query =
        parseOffsetPaginationQuery({
          limit:
            queryInput?.limit,
          offset:
            queryInput?.offset,
        })

      return toCharacterExperiencePageResponse(
        await this.loadExperience.execute(
          actorUserId,
          characterId,
          query,
        ),
      )
    } catch (error: unknown) {
      if (
        error instanceof
          InvalidOffsetPaginationQueryError
      ) {
        throw new BadRequestException({
          code:
            'INVALID_PAGINATION_QUERY',
          field: error.field,
        })
      }

      throwCharacterExperienceHttpError(error)
    }
  }

  @Post('grants')
  async grant(
    @Req() request:
      AuthenticatedCharacterExperienceRequest,
    @Param('characterId')
    characterIdInput: unknown,
    @Body() body: unknown,
  ): Promise<CharacterExperienceResponseDto> {
    const actorUserId =
      authenticatedUserId(request)

    try {
      const command =
        parseGrantCharacterExperienceRequest(
          characterIdInput,
          body,
        )
      return toCharacterExperienceResponse(
        await this.grantExperience.execute(
          actorUserId,
          command,
        ),
      )
    } catch (error: unknown) {
      throwCharacterExperienceHttpError(error)
    }
  }

  @Post('corrections')
  async correct(
    @Req() request:
      AuthenticatedCharacterExperienceRequest,
    @Param('characterId')
    characterIdInput: unknown,
    @Body() body: unknown,
  ): Promise<CharacterExperienceResponseDto> {
    const actorUserId =
      authenticatedUserId(request)

    try {
      const command =
        parseCorrectCharacterExperienceRequest(
          characterIdInput,
          body,
        )
      return toCharacterExperienceResponse(
        await this.correctExperience.execute(
          actorUserId,
          command,
        ),
      )
    } catch (error: unknown) {
      throwCharacterExperienceHttpError(error)
    }
  }
}
