import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common'

import {
  InvalidOffsetPaginationQueryError,
  parseOffsetPaginationQuery,
} from '../../common/offset-pagination'
import {
  ActivateChronicleStoryUseCase,
  ArchiveChronicleStoryUseCase,
  ChronicleStoryImmutableError,
  CompleteChronicleStoryUseCase,
  ChronicleStoryNotFoundError,
  ChronicleStoryTransitionError,
  CreateChronicleStoryReminderUseCase,
  CreateChronicleStoryUseCase,
  ListChronicleStoriesUseCase,
  ListSharedChronicleStoriesUseCase,
  LoadChronicleStoryUseCase,
  RemoveChronicleStoryReminderUseCase,
  ReplaceChronicleStoryContextUseCase,
  UpdateChronicleStoryMilestoneUseCase,
  UpdateChronicleStoryReminderUseCase,
  UpdateChronicleStorySessionProgressUseCase,
  UpdateChronicleStoryUseCase,
} from '../application/chronicle-story.use-cases'
import {
  ChronicleStoryPermissionError,
} from '../application/chronicle-story-permission'
import {
  ChronicleStoryContextReferenceError,
  ChronicleStoryCompletionOperationConflictError,
  ChronicleStoryCompletionPreconditionError,
  ChronicleStoryReminderNotFoundError,
  ChronicleStorySessionLinkNotFoundError,
  ChronicleStoryWriteConflictError,
} from '../application/chronicle-story.repository'
import {
  InvalidChronicleStoryRequestError,
  parseChronicleStoryFilters,
  parseChronicleStoryIdParam,
  parseChronicleStoryMilestoneKeyParam,
  parseChronicleStoryReminderIdParam,
  parseChronicleStorySessionIdParam,
  parseCompleteChronicleStoryRequest,
  parseCreateChronicleStoryRequest,
  parseCreateStoryReminderRequest,
  parseReplaceStoryContextRequest,
  parseStoryRevisionRequest,
  parseUpdateChronicleStoryRequest,
  parseUpdateStoryMilestoneRequest,
  parseUpdateStoryReminderRequest,
  parseUpdateStorySessionProgressRequest,
  toChronicleStoryResponse,
  toSharedChronicleStoryResponse,
} from './chronicle-story.dto'
import {
  InvalidChronicleRequestError,
  parseChronicleIdParam,
  parseChronicleNarratorId,
} from './chronicle.dto'
import type {
  ChronicleStoryResponseDto,
  SharedChronicleStoryResponseDto,
} from './chronicle-story.dto'

interface AuthenticatedChronicleStoryRequest {
  readonly user?: {
    readonly id?: unknown
  }
}

function authenticatedUserId(
  request: AuthenticatedChronicleStoryRequest,
): string {
  try {
    return parseChronicleNarratorId(
      request.user?.id,
    )
  } catch {
    throw new UnauthorizedException({
      code: 'AUTHENTICATION_REQUIRED',
    })
  }
}

function throwChronicleStoryHttpError(
  error: unknown,
): never {
  if (
    error instanceof
      InvalidChronicleRequestError ||
    error instanceof
      InvalidChronicleStoryRequestError ||
    error instanceof
      ChronicleStoryContextReferenceError
  ) {
    throw new BadRequestException({
      code:
        'INVALID_CHRONICLE_STORY_REQUEST',
      message: error.message,
    })
  }

  if (
    error instanceof
      ChronicleStoryPermissionError
  ) {
    throw new ForbiddenException({
      code:
        'CHRONICLE_STORY_PERMISSION_DENIED',
    })
  }

  if (
    error instanceof
      ChronicleStoryNotFoundError ||
    error instanceof
      ChronicleStoryReminderNotFoundError ||
    error instanceof
      ChronicleStorySessionLinkNotFoundError
  ) {
    throw new NotFoundException({
      code:
        error instanceof
          ChronicleStoryReminderNotFoundError
          ? 'CHRONICLE_STORY_REMINDER_NOT_FOUND'
          : error instanceof
              ChronicleStorySessionLinkNotFoundError
            ? 'CHRONICLE_STORY_SESSION_LINK_NOT_FOUND'
          : 'CHRONICLE_STORY_NOT_FOUND',
    })
  }

  if (
    error instanceof
      ChronicleStoryWriteConflictError
  ) {
    throw new ConflictException({
      code:
        'CHRONICLE_STORY_REVISION_CONFLICT',
    })
  }

  if (
    error instanceof ChronicleStoryCompletionOperationConflictError
  ) {
    throw new ConflictException({
      code: 'CHRONICLE_STORY_COMPLETION_OPERATION_CONFLICT',
    })
  }

  if (
    error instanceof ChronicleStoryCompletionPreconditionError
  ) {
    throw new ConflictException({
      code: 'CHRONICLE_STORY_COMPLETION_PRECONDITION_FAILED',
      failure: error.failure,
    })
  }

  if (
    error instanceof
      ChronicleStoryTransitionError ||
    error instanceof
      ChronicleStoryImmutableError
  ) {
    throw new ConflictException({
      code:
        error instanceof
          ChronicleStoryImmutableError
          ? 'CHRONICLE_STORY_READ_ONLY'
          : 'CHRONICLE_STORY_TRANSITION_INVALID',
    })
  }

  throw error
}

@Controller(
  'chronicles/:chronicleId/stories',
)
export class ChronicleStoryController {
  constructor(
    private readonly listStories:
      ListChronicleStoriesUseCase,
    private readonly listSharedStories:
      ListSharedChronicleStoriesUseCase,
    private readonly loadStory:
      LoadChronicleStoryUseCase,
    private readonly createStory:
      CreateChronicleStoryUseCase,
    private readonly updateStory:
      UpdateChronicleStoryUseCase,
    private readonly activateStory:
      ActivateChronicleStoryUseCase,
    private readonly archiveStory:
      ArchiveChronicleStoryUseCase,
    private readonly updateMilestone:
      UpdateChronicleStoryMilestoneUseCase,
    private readonly createReminder:
      CreateChronicleStoryReminderUseCase,
    private readonly updateReminder:
      UpdateChronicleStoryReminderUseCase,
    private readonly removeReminder:
      RemoveChronicleStoryReminderUseCase,
    private readonly replaceContext:
      ReplaceChronicleStoryContextUseCase,
    private readonly updateSessionProgress:
      UpdateChronicleStorySessionProgressUseCase,
    private readonly completeStory:
      CompleteChronicleStoryUseCase,
  ) {}

  @Get()
  async list(
    @Req() request:
      AuthenticatedChronicleStoryRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Query() queryInput?:
      Record<string, unknown>,
  ) {
    const actorUserId =
      authenticatedUserId(request)

    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )
      const pagination =
        parseOffsetPaginationQuery({
          limit: queryInput?.limit,
          offset: queryInput?.offset,
        })
      const query =
        parseChronicleStoryFilters(
          queryInput,
          pagination,
        )
      const page =
        await this.listStories.execute(
          actorUserId,
          chronicleId,
          query,
        )

      return {
        items:
          page.items.map(
            toChronicleStoryResponse,
          ),
        nextOffset: page.nextOffset,
      }
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
      throwChronicleStoryHttpError(error)
    }
  }

  @Get('shared')
  async listShared(
    @Req() request:
      AuthenticatedChronicleStoryRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Query() queryInput?:
      Record<string, unknown>,
  ): Promise<{
    readonly items: readonly SharedChronicleStoryResponseDto[]
    readonly nextOffset: number | null
  }> {
    const actorUserId = authenticatedUserId(request)

    try {
      const chronicleId = parseChronicleIdParam(chronicleIdInput)
      const pagination = parseOffsetPaginationQuery({
        limit: queryInput?.limit,
        offset: queryInput?.offset,
      })
      const query = parseChronicleStoryFilters(
        queryInput,
        pagination,
      )
      const page = await this.listSharedStories.execute(
        actorUserId,
        chronicleId,
        query,
      )

      return {
        items: page.items.map(toSharedChronicleStoryResponse),
        nextOffset: page.nextOffset,
      }
    } catch (error: unknown) {
      if (error instanceof InvalidOffsetPaginationQueryError) {
        throw new BadRequestException({
          code: 'INVALID_PAGINATION_QUERY',
          field: error.field,
        })
      }
      throwChronicleStoryHttpError(error)
    }
  }

  @Post()
  async create(
    @Req() request:
      AuthenticatedChronicleStoryRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Body() body: unknown,
  ): Promise<ChronicleStoryResponseDto> {
    const actorUserId =
      authenticatedUserId(request)
    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )
      const command =
        parseCreateChronicleStoryRequest(
          chronicleId,
          body,
        )
      return toChronicleStoryResponse(
        await this.createStory.execute(
          actorUserId,
          command,
        ),
      )
    } catch (error: unknown) {
      throwChronicleStoryHttpError(error)
    }
  }

  @Get(':storyId')
  async detail(
    @Req() request:
      AuthenticatedChronicleStoryRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('storyId')
    storyIdInput: unknown,
  ): Promise<ChronicleStoryResponseDto> {
    const actorUserId =
      authenticatedUserId(request)
    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )
      const storyId =
        parseChronicleStoryIdParam(
          storyIdInput,
        )
      return toChronicleStoryResponse(
        await this.loadStory.execute(
          actorUserId,
          chronicleId,
          storyId,
        ),
      )
    } catch (error: unknown) {
      throwChronicleStoryHttpError(error)
    }
  }

  @Patch(':storyId')
  async update(
    @Req() request:
      AuthenticatedChronicleStoryRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('storyId')
    storyIdInput: unknown,
    @Body() body: unknown,
  ): Promise<ChronicleStoryResponseDto> {
    const actorUserId =
      authenticatedUserId(request)
    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )
      const storyId =
        parseChronicleStoryIdParam(
          storyIdInput,
        )
      const command =
        parseUpdateChronicleStoryRequest(
          chronicleId,
          storyId,
          body,
        )
      return toChronicleStoryResponse(
        await this.updateStory.execute(
          actorUserId,
          command,
        ),
      )
    } catch (error: unknown) {
      throwChronicleStoryHttpError(error)
    }
  }

  @Post(':storyId/activate')
  async activate(
    @Req() request:
      AuthenticatedChronicleStoryRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('storyId')
    storyIdInput: unknown,
    @Body() body: unknown,
  ): Promise<ChronicleStoryResponseDto> {
    const actorUserId =
      authenticatedUserId(request)
    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )
      const storyId =
        parseChronicleStoryIdParam(
          storyIdInput,
        )
      return toChronicleStoryResponse(
        await this.activateStory.execute(
          actorUserId,
          chronicleId,
          storyId,
          parseStoryRevisionRequest(body),
        ),
      )
    } catch (error: unknown) {
      throwChronicleStoryHttpError(error)
    }
  }

  @Post(':storyId/archive')
  async archive(
    @Req() request:
      AuthenticatedChronicleStoryRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('storyId')
    storyIdInput: unknown,
    @Body() body: unknown,
  ): Promise<ChronicleStoryResponseDto> {
    const actorUserId =
      authenticatedUserId(request)
    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )
      const storyId =
        parseChronicleStoryIdParam(
          storyIdInput,
        )
      return toChronicleStoryResponse(
        await this.archiveStory.execute(
          actorUserId,
          chronicleId,
          storyId,
          parseStoryRevisionRequest(body),
        ),
      )
    } catch (error: unknown) {
      throwChronicleStoryHttpError(error)
    }
  }

  @Post(':storyId/complete')
  async complete(
    @Req() request: AuthenticatedChronicleStoryRequest,
    @Param('chronicleId') chronicleIdInput: unknown,
    @Param('storyId') storyIdInput: unknown,
    @Body() body: unknown,
  ): Promise<ChronicleStoryResponseDto> {
    const actorUserId = authenticatedUserId(request)
    try {
      const chronicleId = parseChronicleIdParam(chronicleIdInput)
      const storyId = parseChronicleStoryIdParam(storyIdInput)
      return toChronicleStoryResponse(
        await this.completeStory.execute(actorUserId, {
          chronicleId,
          storyId,
          ...parseCompleteChronicleStoryRequest(body),
        }),
      )
    } catch (error: unknown) {
      throwChronicleStoryHttpError(error)
    }
  }

  @Patch(':storyId/milestones/:milestoneKey')
  async milestone(
    @Req() request:
      AuthenticatedChronicleStoryRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('storyId')
    storyIdInput: unknown,
    @Param('milestoneKey')
    milestoneKeyInput: unknown,
    @Body() body: unknown,
  ): Promise<ChronicleStoryResponseDto> {
    const actorUserId =
      authenticatedUserId(request)
    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )
      const storyId =
        parseChronicleStoryIdParam(
          storyIdInput,
        )
      const key =
        parseChronicleStoryMilestoneKeyParam(
          milestoneKeyInput,
        )
      const command =
        parseUpdateStoryMilestoneRequest(
          body,
        )
      return toChronicleStoryResponse(
        await this.updateMilestone.execute(
          actorUserId,
          {
            chronicleId,
            storyId,
            key,
            ...command,
          },
        ),
      )
    } catch (error: unknown) {
      throwChronicleStoryHttpError(error)
    }
  }

  @Post(':storyId/reminders')
  async addReminder(
    @Req() request:
      AuthenticatedChronicleStoryRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('storyId')
    storyIdInput: unknown,
    @Body() body: unknown,
  ): Promise<ChronicleStoryResponseDto> {
    const actorUserId =
      authenticatedUserId(request)
    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )
      const storyId =
        parseChronicleStoryIdParam(
          storyIdInput,
        )
      const command =
        parseCreateStoryReminderRequest(
          body,
        )
      return toChronicleStoryResponse(
        await this.createReminder.execute(
          actorUserId,
          {
            chronicleId,
            storyId,
            ...command,
          },
        ),
      )
    } catch (error: unknown) {
      throwChronicleStoryHttpError(error)
    }
  }

  @Patch(':storyId/reminders/:reminderId')
  async changeReminder(
    @Req() request:
      AuthenticatedChronicleStoryRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('storyId')
    storyIdInput: unknown,
    @Param('reminderId')
    reminderIdInput: unknown,
    @Body() body: unknown,
  ): Promise<ChronicleStoryResponseDto> {
    const actorUserId =
      authenticatedUserId(request)
    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )
      const storyId =
        parseChronicleStoryIdParam(
          storyIdInput,
        )
      const reminderId =
        parseChronicleStoryReminderIdParam(
          reminderIdInput,
        )
      const command =
        parseUpdateStoryReminderRequest(
          body,
        )
      return toChronicleStoryResponse(
        await this.updateReminder.execute(
          actorUserId,
          {
            chronicleId,
            storyId,
            reminderId,
            ...command,
          },
        ),
      )
    } catch (error: unknown) {
      throwChronicleStoryHttpError(error)
    }
  }

  @Put(':storyId/context')
  async context(
    @Req() request: AuthenticatedChronicleStoryRequest,
    @Param('chronicleId') chronicleIdInput: unknown,
    @Param('storyId') storyIdInput: unknown,
    @Body() body: unknown,
  ): Promise<ChronicleStoryResponseDto> {
    const actorUserId = authenticatedUserId(request)
    try {
      const chronicleId = parseChronicleIdParam(chronicleIdInput)
      const storyId = parseChronicleStoryIdParam(storyIdInput)
      return toChronicleStoryResponse(
        await this.replaceContext.execute(actorUserId, {
          chronicleId,
          storyId,
          ...parseReplaceStoryContextRequest(body),
        }),
      )
    } catch (error: unknown) {
      throwChronicleStoryHttpError(error)
    }
  }

  @Patch(':storyId/sessions/:sessionId')
  async sessionProgress(
    @Req() request: AuthenticatedChronicleStoryRequest,
    @Param('chronicleId') chronicleIdInput: unknown,
    @Param('storyId') storyIdInput: unknown,
    @Param('sessionId') sessionIdInput: unknown,
    @Body() body: unknown,
  ): Promise<ChronicleStoryResponseDto> {
    const actorUserId = authenticatedUserId(request)
    try {
      const chronicleId = parseChronicleIdParam(chronicleIdInput)
      const storyId = parseChronicleStoryIdParam(storyIdInput)
      const sessionId = parseChronicleStorySessionIdParam(sessionIdInput)
      return toChronicleStoryResponse(
        await this.updateSessionProgress.execute(actorUserId, {
          chronicleId,
          storyId,
          sessionId,
          ...parseUpdateStorySessionProgressRequest(body),
        }),
      )
    } catch (error: unknown) {
      throwChronicleStoryHttpError(error)
    }
  }

  @Delete(':storyId/reminders/:reminderId')
  async deleteReminder(
    @Req() request:
      AuthenticatedChronicleStoryRequest,
    @Param('chronicleId')
    chronicleIdInput: unknown,
    @Param('storyId')
    storyIdInput: unknown,
    @Param('reminderId')
    reminderIdInput: unknown,
    @Body() body: unknown,
  ): Promise<ChronicleStoryResponseDto> {
    const actorUserId =
      authenticatedUserId(request)
    try {
      const chronicleId =
        parseChronicleIdParam(
          chronicleIdInput,
        )
      const storyId =
        parseChronicleStoryIdParam(
          storyIdInput,
        )
      const reminderId =
        parseChronicleStoryReminderIdParam(
          reminderIdInput,
        )
      return toChronicleStoryResponse(
        await this.removeReminder.execute(
          actorUserId,
          {
            chronicleId,
            storyId,
            reminderId,
            expectedRevision:
              parseStoryRevisionRequest(body),
          },
        ),
      )
    } catch (error: unknown) {
      throwChronicleStoryHttpError(error)
    }
  }
}
