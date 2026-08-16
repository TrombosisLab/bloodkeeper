import {
  BadRequestException,
  Body,
  ConflictException,
  ForbiddenException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
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

import type {
  OffsetPage,
} from '../../common/offset-pagination'

import {
  CharacterDraftWriteConflictError,
} from '../application/character-draft.repository'

import {
  CreateCharacterDraftUseCase,
} from '../application/create-character-draft.use-case'

import {
  LoadCharacterDraftUseCase,
} from '../application/load-character-draft.use-case'

import {
  ListCharacterDraftsUseCase,
} from '../application/list-character-drafts.use-case'

import {
  CharacterChronicleAssociationRequiredError,
  HumanCharacterVampireStateMutationError,
  UpdateCharacterDraftUseCase,
} from '../application/update-character-draft.use-case'

import {
  CharacterChronicleAssociationNotFoundError,
  CharacterChronicleChangeConfirmationRequiredError,
  CharacterChronicleMembershipRequiredError,
  UpdateCharacterChronicleAssociationUseCase,
} from '../application/update-character-chronicle-association.use-case'

import {
  InvalidCharacterDraftRequestError,
  parseCharacterDraftIdParam,
  parseCharacterDraftOwnerId,
  parseCreateCharacterDraftRequest,
  parseUpdateCharacterChronicleAssociationRequest,
  parseUpdateCharacterDraftRequest,
  toCharacterDraftResponse,
} from './character-draft.dto'

import type {
  CharacterDraftResponseDto,
} from './character-draft.dto'

import {
  InvalidCharacterAttributeSkillStateError,
} from '../domain/character-attribute-skill.rules'

import {
  InvalidCharacterDamageStateError,
} from '../domain/character-damage.rules'

import {
  InvalidCharacterHumanityStateError,
} from '../domain/character-humanity-state.rules'

import {
  InvalidCharacterHungerError,
} from '../domain/character-hunger.rules'

export interface AuthenticatedCharacterRequest {
  user?: {
    id?: unknown
  }
}

function authenticatedOwnerId(
  request: AuthenticatedCharacterRequest,
): string {
  const ownerId = request.user?.id

  try {
    return parseCharacterDraftOwnerId(ownerId)
  } catch {
    throw new UnauthorizedException({
      code: 'AUTHENTICATION_REQUIRED',
    })
  }
}

function throwCharacterDraftHttpError(
  error: unknown,
): never {
  if (
    error instanceof
      InvalidOffsetPaginationQueryError
  ) {
    throw new BadRequestException({
      code: 'INVALID_PAGINATION_QUERY',
      field: error.field,
    })
  }

  if (
    error instanceof
      InvalidCharacterDraftRequestError
  ) {
    throw new BadRequestException({
      code: 'INVALID_CHARACTER_DRAFT_REQUEST',
      message: error.message,
    })
  }

  if (
    error instanceof
      CharacterDraftWriteConflictError
  ) {
    throw new ConflictException({
      code: 'CHARACTER_DRAFT_WRITE_CONFLICT',
    })
  }

  if (
    error instanceof
      HumanCharacterVampireStateMutationError
  ) {
    throw new UnprocessableEntityException({
      code:
        'CHARACTER_HUMAN_VAMPIRE_STATE_FORBIDDEN',
    })
  }

  if (
    error instanceof
      CharacterChronicleAssociationRequiredError
  ) {
    throw new ConflictException({
      code:
        'CHARACTER_CHRONICLE_ASSOCIATION_REQUIRED',
    })
  }

  if (
    error instanceof
      CharacterChronicleAssociationNotFoundError
  ) {
    throw new NotFoundException({
      code: 'CHARACTER_NOT_FOUND',
    })
  }

  if (
    error instanceof
      CharacterChronicleMembershipRequiredError
  ) {
    throw new ForbiddenException({
      code:
        'CHARACTER_CHRONICLE_MEMBERSHIP_REQUIRED',
    })
  }

  if (
    error instanceof
      CharacterChronicleChangeConfirmationRequiredError
  ) {
    throw new ConflictException({
      code:
        'CHARACTER_CHRONICLE_CONFIRMATION_REQUIRED',
    })
  }

  if (
    error instanceof
      InvalidCharacterAttributeSkillStateError ||
    error instanceof
      InvalidCharacterDamageStateError ||
    error instanceof
      InvalidCharacterHumanityStateError ||
    error instanceof
      InvalidCharacterHungerError
  ) {
    throw new UnprocessableEntityException({
      code: 'CHARACTER_DRAFT_RULE_VIOLATION',
      violations: error.violations,
    })
  }

  throw error
}

@Controller('characters/drafts')
export class CharacterDraftController {
  constructor(
    private readonly createDraft:
      CreateCharacterDraftUseCase,
    private readonly loadDraft:
      LoadCharacterDraftUseCase,
    private readonly listDrafts:
      ListCharacterDraftsUseCase,
    private readonly updateDraft:
      UpdateCharacterDraftUseCase,
    private readonly updateChronicleAssociation:
      UpdateCharacterChronicleAssociationUseCase,
  ) {}

  @Post()
  async create(
    @Req() request: AuthenticatedCharacterRequest,
    @Body() body: unknown,
  ): Promise<CharacterDraftResponseDto> {
    const ownerId = authenticatedOwnerId(request)

    try {
      const command =
        parseCreateCharacterDraftRequest(
          ownerId,
          body,
        )

      const draft =
        await this.createDraft.execute(command)

      return toCharacterDraftResponse(draft)
    } catch (error: unknown) {
      throwCharacterDraftHttpError(error)
    }
  }

  @Get()
  async list(
    @Req() request:
      AuthenticatedCharacterRequest,
    @Query() queryInput?:
      Record<string, unknown>,
  ): Promise<
    | readonly CharacterDraftResponseDto[]
    | OffsetPage<CharacterDraftResponseDto>
  > {
    const ownerId =
      authenticatedOwnerId(request)

    if (queryInput === undefined) {
      const drafts =
        await this.listDrafts.execute(
          ownerId,
        )

      return drafts.map(
        toCharacterDraftResponse,
      )
    }

    try {
      const query =
        parseOffsetPaginationQuery({
          limit: queryInput.limit,
          offset: queryInput.offset,
        })

      const page =
        await this.listDrafts.execute(
          ownerId,
          query,
        )

      return {
        items: page.items.map(
          toCharacterDraftResponse,
        ),
        nextOffset:
          page.nextOffset,
      }
    } catch (error: unknown) {
      throwCharacterDraftHttpError(
        error,
      )
    }
  }

  @Get(':characterId')
  async load(
    @Req() request: AuthenticatedCharacterRequest,
    @Param('characterId') characterIdInput: unknown,
  ): Promise<CharacterDraftResponseDto> {
    const ownerId = authenticatedOwnerId(request)

    try {
      const characterId =
        parseCharacterDraftIdParam(
          characterIdInput,
        )
      const draft = await this.loadDraft.execute(
        ownerId,
        characterId,
      )

      if (draft === null) {
        throw new NotFoundException({
          code: 'CHARACTER_DRAFT_NOT_FOUND',
        })
      }

      return toCharacterDraftResponse(draft)
    } catch (error: unknown) {
      throwCharacterDraftHttpError(error)
    }
  }

  @Patch(':characterId')
  async update(
    @Req() request: AuthenticatedCharacterRequest,
    @Param('characterId') characterIdInput: unknown,
    @Body() body: unknown,
  ): Promise<CharacterDraftResponseDto> {
    const ownerId = authenticatedOwnerId(request)

    try {
      const command =
        parseUpdateCharacterDraftRequest(
          characterIdInput,
          body,
        )
      const draft =
        await this.updateDraft.execute(
          ownerId,
          command,
        )

      return toCharacterDraftResponse(draft)
    } catch (error: unknown) {
      throwCharacterDraftHttpError(error)
    }
  }
  @Patch(':characterId/chronicle')
  async updateChronicle(
    @Req() request:
      AuthenticatedCharacterRequest,
    @Param('characterId')
    characterIdInput: unknown,
    @Body() body: unknown,
  ): Promise<CharacterDraftResponseDto> {
    const ownerId =
      authenticatedOwnerId(request)

    try {
      const command =
        parseUpdateCharacterChronicleAssociationRequest(
          characterIdInput,
          body,
        )

      const draft =
        await this.updateChronicleAssociation
          .execute(
            ownerId,
            command,
          )

      return toCharacterDraftResponse(
        draft,
      )
    } catch (error: unknown) {
      throwCharacterDraftHttpError(error)
    }
  }

}
