import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common'

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
  UpdateCharacterDraftUseCase,
} from '../application/update-character-draft.use-case'

import {
  InvalidCharacterDraftRequestError,
  parseCharacterDraftIdParam,
  parseCharacterDraftOwnerId,
  parseCreateCharacterDraftRequest,
  parseUpdateCharacterDraftRequest,
  toCharacterDraftResponse,
} from './character-draft.dto'

import type {
  CharacterDraftResponseDto,
} from './character-draft.dto'

import {
  InvalidCharacterAttributeSkillStateError,
} from '../domain/character-attribute-skill.rules'

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
      InvalidCharacterAttributeSkillStateError
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
    private readonly updateDraft:
      UpdateCharacterDraftUseCase,
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
}
