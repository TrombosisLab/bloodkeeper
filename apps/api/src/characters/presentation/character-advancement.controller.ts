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
  PreviewCharacterAdvancementUseCase,
} from '../application/preview-character-advancement.use-case'
import {
  CharacterAdvancementRejectedError,
  PurchaseCharacterAdvancementUseCase,
} from '../application/purchase-character-advancement.use-case'
import {
  CharacterAdvancementArchivedError,
  CharacterAdvancementRevisionConflictError,
  CharacterExperienceDuplicateError,
  CharacterExperienceInsufficientError,
} from '../application/character-experience.repository'
import {
  InvalidPersistedCharacterStateError,
} from '../domain/character-validator'
import {
  toCharacterDraftResponse,
} from './character-draft.dto'
import {
  toCharacterExperienceResponse,
} from './character-experience.dto'
import {
  CharacterExperienceCharacterNotFoundError,
} from '../application/character-experience.use-cases'
import {
  CharacterExperiencePermissionError,
} from '../application/character-experience-permission'
import {
  InvalidCharacterExperienceRequestError,
  parseCharacterExperienceIdParam,
  parseCharacterExperienceUserId,
} from './character-experience.dto'
import {
  InvalidCharacterAdvancementRequestError,
  parseCharacterAdvancementPreviewRequest,
  parseCharacterAdvancementPurchase,
  toCharacterAdvancementPreviewResponse,
} from './character-advancement.dto'
import type {
  CharacterAdvancementPreviewResponseDto,
} from './character-advancement.dto'

interface AuthenticatedRequest { readonly user?: { readonly id?: unknown } }

@Controller('characters/:characterId/experience')
export class CharacterAdvancementController {
  constructor(
    private readonly preview: PreviewCharacterAdvancementUseCase,
    private readonly purchase: PurchaseCharacterAdvancementUseCase,
  ) {}

  @Post('preview')
  async execute(
    @Req() request: AuthenticatedRequest,
    @Param('characterId') characterIdInput: unknown,
    @Body() body: unknown,
  ): Promise<CharacterAdvancementPreviewResponseDto> {
    let actorUserId: string
    try {
      actorUserId = parseCharacterExperienceUserId(request.user?.id)
    } catch {
      throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' })
    }
    try {
      const characterId = parseCharacterExperienceIdParam(characterIdInput)
      const previewRequest =
        parseCharacterAdvancementPreviewRequest(
          body,
        )

      return toCharacterAdvancementPreviewResponse(
        await this.preview.execute(
          actorUserId,
          characterId,
          previewRequest.advancement,
          previewRequest
            .useDyscrasiaExperience,
        ),
      )
    } catch (error: unknown) {
      if (
        error instanceof InvalidCharacterAdvancementRequestError ||
        error instanceof InvalidCharacterExperienceRequestError
      ) {
        throw new BadRequestException({ code: 'INVALID_CHARACTER_ADVANCEMENT_REQUEST', message: error.message })
      }
      if (error instanceof CharacterExperiencePermissionError) {
        throw new ForbiddenException({ code: 'CHARACTER_ADVANCEMENT_PERMISSION_DENIED' })
      }
      if (error instanceof CharacterExperienceCharacterNotFoundError) {
        throw new NotFoundException({ code: 'CHARACTER_NOT_FOUND' })
      }
      throw error
    }
  }

  @Post('purchase')
  async purchaseAdvancement(
    @Req() request: AuthenticatedRequest,
    @Param('characterId') characterIdInput: unknown,
    @Body() body: unknown,
  ): Promise<unknown> {
    let actorUserId: string
    try {
      actorUserId = parseCharacterExperienceUserId(request.user?.id)
    } catch {
      throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED' })
    }

    try {
      const characterId = parseCharacterExperienceIdParam(characterIdInput)
      const result = await this.purchase.execute(
        actorUserId,
        parseCharacterAdvancementPurchase(body, characterId),
      )
      return {
        character: toCharacterDraftResponse(result.character),
        experience: toCharacterExperienceResponse(result.experience),
        preview: result.preview,
        validation: result.validation,
      }
    } catch (error: unknown) {
      if (
        error instanceof InvalidCharacterAdvancementRequestError ||
        error instanceof InvalidCharacterExperienceRequestError
      ) {
        throw new BadRequestException({ code: 'INVALID_CHARACTER_ADVANCEMENT_REQUEST', message: error.message })
      }
      if (error instanceof CharacterExperiencePermissionError) {
        throw new ForbiddenException({ code: 'CHARACTER_ADVANCEMENT_PERMISSION_DENIED' })
      }
      if (error instanceof CharacterExperienceCharacterNotFoundError) {
        throw new NotFoundException({ code: 'CHARACTER_NOT_FOUND' })
      }
      if (error instanceof CharacterAdvancementRejectedError) {
        throw new UnprocessableEntityException({ code: 'CHARACTER_ADVANCEMENT_REJECTED', preview: error.preview })
      }
      if (error instanceof InvalidPersistedCharacterStateError) {
        throw new UnprocessableEntityException({ code: 'CHARACTER_EVOLUTION_INVALID', validation: error.report })
      }
      if (error instanceof CharacterAdvancementArchivedError) {
        throw new UnprocessableEntityException({ code: 'CHARACTER_ARCHIVED' })
      }
      if (error instanceof CharacterExperienceInsufficientError) {
        throw new ConflictException({ code: 'EXPERIENCE_INSUFFICIENT' })
      }
      if (error instanceof CharacterExperienceDuplicateError) {
        throw new ConflictException({ code: 'EXPERIENCE_MOVEMENT_DUPLICATE' })
      }
      if (error instanceof CharacterAdvancementRevisionConflictError) {
        throw new ConflictException({ code: 'CHARACTER_REVISION_CONFLICT' })
      }
      throw error
    }
  }

}
