import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  NotFoundException,
  Param,
  Patch,
  Req,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common'

import {
  CharacterInitialVampireResolutionWriteConflictError,
} from '../application/character-draft.repository'

import {
  InitialVampireAdvantagesInvalidError,
  InitialVampireDecisionAlreadyResolvedError,
  InitialVampireDisciplineInvalidError,
  InitialVampirePrerequisitePendingError,
  InitialVampireResolutionArchivedError,
  InitialVampireResolutionCreationModeError,
  InitialVampireResolutionNatureError,
  InitialVampireResolutionNotFoundError,
  InitialVampireResolutionPermissionError,
  InitialVampireSelectionInvalidError,
  ResolveInitialVampireStateUseCase,
} from '../application/resolve-initial-vampire-state.use-case'

import {
  parseCharacterDraftOwnerId,
} from './character-draft.dto'

import {
  InvalidInitialVampireResolutionRequestError,
  parseEstablishInitialBloodRequest,
  parseManifestInitialDisciplineRequest,
  parseManifestInitialPowerRequest,
  parseReviewInitialAdvantagesRequest,
  parseResolveInitialClanRequest,
  parseResolveInitialGenerationRequest,
  toInitialVampireResolutionResponse,
} from './character-initial-vampire.dto'

import type {
  InitialVampireResolutionResponseDto,
} from './character-initial-vampire.dto'

interface AuthenticatedInitialVampireRequest {
  readonly user?: {
    readonly id?: unknown
  }
}

function authenticatedActorId(
  request:
    AuthenticatedInitialVampireRequest,
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

function throwInitialVampireHttpError(
  error: unknown,
): never {
  if (
    error instanceof
      InvalidInitialVampireResolutionRequestError
  ) {
    throw new BadRequestException({
      code:
        'INVALID_INITIAL_VAMPIRE_RESOLUTION_REQUEST',
      message: error.message,
    })
  }

  if (
    error instanceof
      InitialVampireResolutionNotFoundError
  ) {
    throw new NotFoundException({
      code: 'CHARACTER_NOT_FOUND',
    })
  }

  if (
    error instanceof
      InitialVampireResolutionPermissionError
  ) {
    throw new ForbiddenException({
      code:
        'INITIAL_VAMPIRE_RESOLUTION_PERMISSION_DENIED',
    })
  }

  if (
    error instanceof
      CharacterInitialVampireResolutionWriteConflictError
  ) {
    throw new ConflictException({
      code: 'CHARACTER_REVISION_CONFLICT',
    })
  }

  if (
    error instanceof
      InitialVampireDecisionAlreadyResolvedError
  ) {
    throw new ConflictException({
      code:
        'INITIAL_VAMPIRE_DECISION_ALREADY_RESOLVED',
      decision: error.decision,
    })
  }

  if (
    error instanceof
      InitialVampirePrerequisitePendingError
  ) {
    throw new UnprocessableEntityException({
      code:
        'INITIAL_VAMPIRE_PREREQUISITE_PENDING',
      prerequisite: error.prerequisite,
    })
  }

  if (
    error instanceof
      InitialVampireResolutionArchivedError
  ) {
    throw new UnprocessableEntityException({
      code: 'CHARACTER_ARCHIVED',
    })
  }

  if (
    error instanceof
      InitialVampireResolutionNatureError
  ) {
    throw new UnprocessableEntityException({
      code:
        'CHARACTER_NATURE_INCOMPATIBLE',
    })
  }

  if (
    error instanceof
      InitialVampireResolutionCreationModeError
  ) {
    throw new UnprocessableEntityException({
      code:
        'CHARACTER_CREATION_MODE_INCOMPATIBLE',
    })
  }

  if (
    error instanceof
      InitialVampireSelectionInvalidError
  ) {
    throw new UnprocessableEntityException({
      code:
        'INITIAL_VAMPIRE_SELECTION_INVALID',
      violations: error.violations,
    })
  }

  if (
    error instanceof
      InitialVampireDisciplineInvalidError
  ) {
    throw new UnprocessableEntityException({
      code:
        'INITIAL_VAMPIRE_DISCIPLINE_SELECTION_INVALID',
      violations: error.violations,
    })
  }

  if (
    error instanceof
      InitialVampireAdvantagesInvalidError
  ) {
    throw new UnprocessableEntityException({
      code:
        'INITIAL_VAMPIRE_ADVANTAGES_REVIEW_INVALID',
      issues: error.issues,
    })
  }

  throw error
}

@Controller('characters')
export class CharacterInitialVampireController {
  constructor(
    private readonly resolve:
      ResolveInitialVampireStateUseCase,
  ) {}

  @Patch(
    ':characterId/initial-vampire/clan',
  )
  async clan(
    @Req()
    request:
      AuthenticatedInitialVampireRequest,
    @Param('characterId')
    characterIdInput: unknown,
    @Body() body: unknown,
  ): Promise<InitialVampireResolutionResponseDto> {
    const actorUserId =
      authenticatedActorId(request)

    try {
      return toInitialVampireResolutionResponse(
        await this.resolve.resolveClan(
          actorUserId,
          parseResolveInitialClanRequest(
            characterIdInput,
            body,
          ),
        ),
      )
    } catch (error: unknown) {
      throwInitialVampireHttpError(error)
    }
  }

  @Patch(
    ':characterId/initial-vampire/generation',
  )
  async generation(
    @Req()
    request:
      AuthenticatedInitialVampireRequest,
    @Param('characterId')
    characterIdInput: unknown,
    @Body() body: unknown,
  ): Promise<InitialVampireResolutionResponseDto> {
    const actorUserId =
      authenticatedActorId(request)

    try {
      return toInitialVampireResolutionResponse(
        await this.resolve.resolveGeneration(
          actorUserId,
          parseResolveInitialGenerationRequest(
            characterIdInput,
            body,
          ),
        ),
      )
    } catch (error: unknown) {
      throwInitialVampireHttpError(error)
    }
  }

  @Patch(
    ':characterId/initial-vampire/blood',
  )
  async blood(
    @Req()
    request:
      AuthenticatedInitialVampireRequest,
    @Param('characterId')
    characterIdInput: unknown,
    @Body() body: unknown,
  ): Promise<InitialVampireResolutionResponseDto> {
    const actorUserId =
      authenticatedActorId(request)

    try {
      return toInitialVampireResolutionResponse(
        await this.resolve.establishBlood(
          actorUserId,
          parseEstablishInitialBloodRequest(
            characterIdInput,
            body,
          ),
        ),
      )
    } catch (error: unknown) {
      throwInitialVampireHttpError(error)
    }
  }

  @Patch(
    ':characterId/initial-vampire/discipline',
  )
  async discipline(
    @Req()
    request:
      AuthenticatedInitialVampireRequest,
    @Param('characterId')
    characterIdInput: unknown,
    @Body() body: unknown,
  ): Promise<InitialVampireResolutionResponseDto> {
    const actorUserId =
      authenticatedActorId(request)

    try {
      return toInitialVampireResolutionResponse(
        await this.resolve.manifestDiscipline(
          actorUserId,
          parseManifestInitialDisciplineRequest(
            characterIdInput,
            body,
          ),
        ),
      )
    } catch (error: unknown) {
      throwInitialVampireHttpError(error)
    }
  }

  @Patch(
    ':characterId/initial-vampire/power',
  )
  async power(
    @Req()
    request:
      AuthenticatedInitialVampireRequest,
    @Param('characterId')
    characterIdInput: unknown,
    @Body() body: unknown,
  ): Promise<InitialVampireResolutionResponseDto> {
    const actorUserId =
      authenticatedActorId(request)

    try {
      return toInitialVampireResolutionResponse(
        await this.resolve.manifestPower(
          actorUserId,
          parseManifestInitialPowerRequest(
            characterIdInput,
            body,
          ),
        ),
      )
    } catch (error: unknown) {
      throwInitialVampireHttpError(error)
    }
  }


  @Patch(
    ':characterId/initial-vampire/advantages',
  )
  async advantages(
    @Req()
    request:
      AuthenticatedInitialVampireRequest,
    @Param('characterId')
    characterIdInput: unknown,
    @Body() body: unknown,
  ): Promise<InitialVampireResolutionResponseDto> {
    const actorUserId =
      authenticatedActorId(request)

    try {
      return toInitialVampireResolutionResponse(
        await this.resolve.reviewAdvantages(
          actorUserId,
          parseReviewInitialAdvantagesRequest(
            characterIdInput,
            body,
          ),
        ),
      )
    } catch (error: unknown) {
      throwInitialVampireHttpError(error)
    }
  }

}
